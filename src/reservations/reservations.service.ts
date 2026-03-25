import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import { intervalsOverlap } from '../common/utils/interval.utils';
import {
  getWeekBoundsUtc,
  localToUtc,
  utcToLocalDateString,
  utcToLocalTimeString,
} from '../common/utils/timezone.utils';
import { CreateReservationSchema } from './dto/create-reservation.dto';
import type { ReservationsQuery } from './dto/reservations-query.dto';
import type { UpdateReservationDto } from './dto/update-reservation.dto';

type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

const MAX_RESERVATIONS_PER_WEEK = 3;
const DEFAULT_TIMEZONE = 'UTC';

function serializeReservation(
  r: {
    startAt: Date;
    endAt: Date;
    space?: { place?: { timezone: string } | null };
  } & Record<string, unknown>,
  options?: { excludeRelations?: boolean },
) {
  const tz = r.space?.place?.timezone ?? DEFAULT_TIMEZONE;
  const { space: _space, ...rest } = r as typeof r & { space?: unknown };
  const serialized = {
    ...rest,
    reservationDate: utcToLocalDateString(r.startAt, tz),
    timezone: tz,
  };
  return options?.excludeRelations
    ? serialized
    : { ...serialized, space: _space };
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationInput) {
    const {
      spaceId,
      placeId,
      clientEmail,
      reservationDate,
      startTime,
      endTime,
      ...rest
    } = createReservationDto;

    return this.prisma.$transaction(
      async (tx) => {
        const space = await tx.space.findUnique({
          where: { id: spaceId },
          select: { placeId: true, place: { select: { timezone: true } } },
        });
        if (!space) {
          throw new NotFoundException({
            message: 'Space not found',
            errorCode: 'ERR_SPACE_NOT_FOUND',
          });
        }

        const timezone = space.place?.timezone ?? DEFAULT_TIMEZONE;
        const startAt = localToUtc(reservationDate, startTime, timezone);
        const endAt = localToUtc(reservationDate, endTime, timezone);

        if (endAt.getTime() <= startAt.getTime()) {
          throw new ConflictException({
            message: 'endTime must be after startTime',
            errorCode: 'ERR_INVALID_TIME_RANGE',
          });
        }

        const existingForSpace = await tx.reservation.findMany({
          where: { spaceId },
        });

        for (const existing of existingForSpace) {
          if (
            intervalsOverlap(
              startAt.getTime(),
              endAt.getTime(),
              existing.startAt.getTime(),
              existing.endAt.getTime(),
            )
          ) {
            throw new ConflictException({
              message:
                'This space is already reserved for the requested time slot',
              errorCode: 'ERR_SCHEDULE_CONFLICT',
            });
          }
        }

        const { start: weekStart, end: weekEnd } = getWeekBoundsUtc(
          startAt,
          timezone,
        );
        const countInWeek = await tx.reservation.count({
          where: {
            clientEmail,
            startAt: { gte: weekStart, lte: weekEnd },
          },
        });
        if (countInWeek >= MAX_RESERVATIONS_PER_WEEK) {
          throw new ConflictException({
            message: `Client has reached the maximum of ${MAX_RESERVATIONS_PER_WEEK} reservations per week`,
            errorCode: 'ERR_RESERVATION_LIMIT',
          });
        }

        const created = await tx.reservation.create({
          data: {
            clientEmail,
            startAt,
            endAt,
            spaceId,
            placeId: placeId ?? space.placeId,
            ...rest,
          } as Prisma.ReservationUncheckedCreateInput,
          include: { space: { include: { place: true } } },
        });

        return serializeReservation(created);
      },
      { timeout: 10000 },
    );
  }

  async findAll(query?: ReservationsQuery) {
    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 10));
    const skip = (page - 1) * pageSize;
    const sortBy = query?.sortBy ?? 'startAt';
    const sortOrder = query?.sortOrder ?? 'asc';

    const where: Prisma.ReservationWhereInput = {};
    if (query?.spaceId) where.spaceId = query.spaceId;
    if (query?.placeId) where.placeId = query.placeId;
    if (query?.clientEmail) where.clientEmail = query.clientEmail;

    if (query?.fromDate || query?.toDate) {
      where.startAt = {};
      if (query.fromDate) {
        (where.startAt as Prisma.DateTimeFilter).gte = new Date(
          `${query.fromDate}T00:00:00.000Z`,
        );
      }
      if (query.toDate) {
        (where.startAt as Prisma.DateTimeFilter).lte = new Date(
          `${query.toDate}T23:59:59.999Z`,
        );
      }
    }

    const orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.ReservationOrderByWithRelationInput;

    const [items, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          space: { select: { place: { select: { timezone: true } } } },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      items: items.map((r) =>
        serializeReservation(r, { excludeRelations: true }),
      ),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) {
      throw new NotFoundException({
        message: 'Reservation not found',
        errorCode: 'ERR_RESERVATION_NOT_FOUND',
      });
    }
    return serializeReservation(reservation, { excludeRelations: true });
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { space: { include: { place: true } } },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Reservation not found',
        errorCode: 'ERR_RESERVATION_NOT_FOUND',
      });
    }

    const spaceId = updateReservationDto.spaceId ?? existing.spaceId;
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { placeId: true, place: { select: { timezone: true } } },
    });
    if (!space) {
      throw new NotFoundException({
        message: 'Space not found',
        errorCode: 'ERR_SPACE_NOT_FOUND',
      });
    }

    const timezone = space.place?.timezone ?? DEFAULT_TIMEZONE;

    let startAt: Date;
    let endAt: Date;

    if (
      updateReservationDto.reservationDate != null ||
      updateReservationDto.startTime != null ||
      updateReservationDto.endTime != null
    ) {
      const dateStr =
        updateReservationDto.reservationDate != null
          ? updateReservationDto.reservationDate
          : utcToLocalDateString(existing.startAt, timezone);
      const startTimeStr =
        updateReservationDto.startTime ??
        utcToLocalTimeString(existing.startAt, timezone);
      const endTimeStr =
        updateReservationDto.endTime ??
        utcToLocalTimeString(existing.endAt, timezone);

      startAt = localToUtc(dateStr, startTimeStr, timezone);
      endAt = localToUtc(dateStr, endTimeStr, timezone);
    } else {
      startAt = existing.startAt;
      endAt = existing.endAt;
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new ConflictException({
        message: 'endTime must be after startTime',
        errorCode: 'ERR_INVALID_TIME_RANGE',
      });
    }

    const existingForSpace = await this.prisma.reservation.findMany({
      where: {
        id: { not: id },
        spaceId,
      },
    });

    for (const other of existingForSpace) {
      if (
        intervalsOverlap(
          startAt.getTime(),
          endAt.getTime(),
          other.startAt.getTime(),
          other.endAt.getTime(),
        )
      ) {
        throw new ConflictException({
          message: 'This space is already reserved for the requested time slot',
          errorCode: 'ERR_SCHEDULE_CONFLICT',
        });
      }
    }

    const { start: weekStart, end: weekEnd } = getWeekBoundsUtc(
      startAt,
      timezone,
    );
    const effectiveClientEmail =
      updateReservationDto.clientEmail ?? existing.clientEmail;
    const countInWeek = await this.prisma.reservation.count({
      where: {
        clientEmail: effectiveClientEmail,
        id: { not: id },
        startAt: { gte: weekStart, lte: weekEnd },
      },
    });
    if (countInWeek >= MAX_RESERVATIONS_PER_WEEK) {
      throw new ConflictException({
        message: `Client has reached the maximum of ${MAX_RESERVATIONS_PER_WEEK} reservations per week`,
        errorCode: 'ERR_RESERVATION_LIMIT',
      });
    }

    const data: Prisma.ReservationUncheckedUpdateInput = {};
    if (updateReservationDto.spaceId != null)
      data.spaceId = updateReservationDto.spaceId;
    if (updateReservationDto.placeId != null)
      data.placeId = updateReservationDto.placeId;
    if (updateReservationDto.clientEmail != null)
      data.clientEmail = updateReservationDto.clientEmail;
    if (
      updateReservationDto.reservationDate != null ||
      updateReservationDto.startTime != null ||
      updateReservationDto.endTime != null
    ) {
      data.startAt = startAt;
      data.endAt = endAt;
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data,
      include: { space: { include: { place: true } } },
    });

    return serializeReservation(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Reservation not found',
        errorCode: 'ERR_RESERVATION_NOT_FOUND',
      });
    }
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
