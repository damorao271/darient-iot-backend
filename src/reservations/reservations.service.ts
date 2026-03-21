import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReservationSchema } from './dto/create-reservation.dto';
import type { UpdateReservationDto } from './dto/update-reservation.dto';

type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationInput) {
    const { spaceId, placeId, ...rest } = createReservationDto;
    const space = await this.prisma.space.findUniqueOrThrow({
      where: { id: spaceId },
      select: { placeId: true },
    });
    return this.prisma.reservation.create({
      data: {
        ...rest,
        spaceId,
        placeId: placeId ?? space.placeId,
      } as Prisma.ReservationUncheckedCreateInput,
      include: { space: true },
    });
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

  update(id: string, updateReservationDto: UpdateReservationDto) {
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
