import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import { intervalsOverlap } from '../common/utils/interval.utils';
import { parseTimeToMinutes } from '../common/utils/time.utils';
import { CreateReservationSchema } from './dto/create-reservation.dto';
import type { UpdateReservationDto } from './dto/update-reservation.dto';
import { getWeekBounds } from './utils/week.utils';

type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

const MAX_RESERVATIONS_PER_WEEK = 3;

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

    return this.prisma.$mpl(
      async (tx) => {
        const space = await tx.space.findUnique({
          where: { id: spaceId },
          select: { placeId: true },
        });
        if (!space) {
          throw new NotFoundException({
            message: 'Space not found',
            errorCode: 'ERR_SPACE_NOT_FOUND',
          });
        }

        const resDate = new Date(reservationDate);
        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);

        const existingForSpace = await tx.reservation.findMany({
          where: {
            spaceId,
            reservationDate: {
              gte: new Date(
                resDate.getFullYear(),
                resDate.getMonth(),
                resDate.getDate(),
              ),
              lt: new Date(
                resDate.getFullYear(),
                resDate.getMonth(),
                resDate.getDate() + 1,
              ),
            },
          },
        });

        for (const existing of existingForSpace) {
          const exStart = parseTimeToMinutes(existing.startTime);
          const exEnd = parseTimeToMinutes(existing.endTime);
          if (intervalsOverlap(startMinutes, endMinutes, exStart, exEnd)) {
            throw new ConflictException({
              message:
                'This space is already reserved for the requested time slot',
              errorCode: 'ERR_SCHEDULE_CONFLICT',
            });
          }
        }

        const { start: weekStart, end: weekEnd } = getWeekBounds(resDate);
        const countInWeek = await tx.reservation.count({
          where: {
            clientEmail,
            reservationDate: { gte: weekStart, lte: weekEnd },
          },
        });
        if (countInWeek >= MAX_RESERVATIONS_PER_WEEK) {
          throw new ConflictException({
            message: `Client has reached the maximum of ${MAX_RESERVATIONS_PER_WEEK} reservations per week`,
            errorCode: 'ERR_RESERVATION_LIMIT',
          });
        }

        return tx.reservation.create({
          data: {
            clientEmail,
            reservationDate: resDate,
            startTime,
            endTime,
            spaceId,
            placeId: placeId ?? space.placeId,
            ...rest,
          } as Prisma.ReservationUncheckedCreateInput,
          include: { space: true },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );
  }

  async findAll(pagination?: PaginationOptions) {
    const page = Math.max(1, pagination?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, pagination?.pageSize ?? 10));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.reservation.findMany({
        skip,
        take: pageSize,
        orderBy: { reservationDate: 'desc' },
        include: { space: true },
      }),
      this.prisma.reservation.count(),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.reservation.findUniqueOrThrow({
      where: { id },
      include: { space: true },
    });
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { space: true },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Reservation not found',
        errorCode: 'ERR_RESERVATION_NOT_FOUND',
      });
    }

    const effectiveSpaceId = updateReservationDto.spaceId ?? existing.spaceId;
    const effectiveDate = updateReservationDto.reservationDate
      ? new Date(updateReservationDto.reservationDate)
      : existing.reservationDate;
    const effectiveStartTime =
      updateReservationDto.startTime ?? existing.startTime;
    const effectiveEndTime = updateReservationDto.endTime ?? existing.endTime;
    const effectiveClientEmail =
      updateReservationDto.clientEmail ?? existing.clientEmail;

    const startMinutes = parseTimeToMinutes(effectiveStartTime);
    const endMinutes = parseTimeToMinutes(effectiveEndTime);
    if (endMinutes <= startMinutes) {
      throw new ConflictException({
        message: 'endTime must be after startTime',
        errorCode: 'ERR_INVALID_TIME_RANGE',
      });
    }

    const space = await this.prisma.space.findUnique({
      where: { id: effectiveSpaceId },
      select: { placeId: true },
    });
    if (!space) {
      throw new NotFoundException({
        message: 'Space not found',
        errorCode: 'ERR_SPACE_NOT_FOUND',
      });
    }

    const dayStart = new Date(
      effectiveDate.getFullYear(),
      effectiveDate.getMonth(),
      effectiveDate.getDate(),
    );
    const dayEnd = new Date(
      effectiveDate.getFullYear(),
      effectiveDate.getMonth(),
      effectiveDate.getDate() + 1,
    );

    const existingForSpace = await this.prisma.reservation.findMany({
      where: {
        id: { not: id },
        spaceId: effectiveSpaceId,
        reservationDate: { gte: dayStart, lt: dayEnd },
      },
    });

    for (const other of existingForSpace) {
      const exStart = parseTimeToMinutes(other.startTime);
      const exEnd = parseTimeToMinutes(other.endTime);
      if (intervalsOverlap(startMinutes, endMinutes, exStart, exEnd)) {
        throw new ConflictException({
          message: 'This space is already reserved for the requested time slot',
          errorCode: 'ERR_SCHEDULE_CONFLICT',
        });
      }
    }

    const { start: weekStart, end: weekEnd } = getWeekBounds(effectiveDate);
    const countInWeek = await this.prisma.reservation.count({
      where: {
        clientEmail: effectiveClientEmail,
        reservationDate: { gte: weekStart, lte: weekEnd },
        id: { not: id },
      },
    });
    if (countInWeek >= MAX_RESERVATIONS_PER_WEEK) {
      throw new ConflictException({
        message: `Client has reached the maximum of ${MAX_RESERVATIONS_PER_WEEK} reservations per week`,
        errorCode: 'ERR_RESERVATION_LIMIT',
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
      include: { space: true },
    });
  }

  remove(id: string) {
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
