import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreateSpaceDto } from './dto/create-space.dto';
import type { SpacesQuery } from './dto/spaces-query.dto';
import type { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSpaceDto: CreateSpaceDto) {
    const place = await this.prisma.place.findUnique({
      where: { id: createSpaceDto.placeId },
    });
    if (!place) {
      throw new NotFoundException({
        message: 'Place not found',
        errorCode: 'ERR_PLACE_NOT_FOUND',
      });
    }

    const existing = await this.prisma.space.findFirst({
      where: {
        placeId: createSpaceDto.placeId,
        name: createSpaceDto.name,
      },
    });
    if (existing) {
      throw new ConflictException({
        message: 'A space with this name already exists in this place',
        errorCode: 'ERR_DUPLICATE_SPACE',
      });
    }

    return this.prisma.space.create({
      data: createSpaceDto as Prisma.SpaceUncheckedCreateInput,
      include: { place: true, reservations: true },
    });
  }

  async findAll(query?: SpacesQuery) {
    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 10));
    const sortBy = query?.sortBy ?? 'name';
    const sortOrder = query?.sortOrder ?? 'asc';

    const where: Prisma.SpaceWhereInput = {};

    if (query?.name?.trim()) {
      where.name = {
        contains: query.name.trim(),
        mode: 'insensitive',
      };
    }

    if (query?.hasReservations === true) {
      where.reservations = { some: {} };
    } else if (query?.hasReservations === false) {
      where.reservations = { none: {} };
    }

    const skip = (page - 1) * pageSize;
    const orderBy =
      sortBy === 'name' ? { name: sortOrder } : { capacity: sortOrder };

    const [items, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: { place: true, reservations: true },
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        sortBy,
        sortOrder,
        ...(query?.name && { name: query.name }),
        ...(query?.hasReservations !== undefined && {
          hasReservations: query.hasReservations,
        }),
      },
    };
  }

  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { place: true, reservations: true },
    });
    if (!space) {
      throw new NotFoundException({
        message: 'Space not found',
        errorCode: 'ERR_SPACE_NOT_FOUND',
      });
    }
    return space;
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({
      where: { id },
    });
    if (!space) {
      throw new NotFoundException({
        message: 'Space not found',
        errorCode: 'ERR_SPACE_NOT_FOUND',
      });
    }

    if (updateSpaceDto.placeId !== undefined) {
      const place = await this.prisma.place.findUnique({
        where: { id: updateSpaceDto.placeId },
      });
      if (!place) {
        throw new NotFoundException({
          message: 'Place not found',
          errorCode: 'ERR_PLACE_NOT_FOUND',
        });
      }
    }

    if (updateSpaceDto.name !== undefined) {
      const targetPlaceId = updateSpaceDto.placeId ?? space.placeId;
      const existing = await this.prisma.space.findFirst({
        where: {
          placeId: targetPlaceId,
          name: updateSpaceDto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException({
          message: 'A space with this name already exists in this place',
          errorCode: 'ERR_DUPLICATE_SPACE',
        });
      }
    }

    return this.prisma.space.update({
      where: { id },
      data: updateSpaceDto,
      include: {
        place: true,
        reservations: true,
      },
    });
  }

  async remove(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { reservations: true },
    });
    if (!space) {
      throw new NotFoundException({
        message: 'Space not found',
        errorCode: 'ERR_SPACE_NOT_FOUND',
      });
    }
    if (space.reservations.length > 0) {
      throw new ConflictException({
        message: 'Cannot delete space with active reservations',
        errorCode: 'ERR_SPACE_HAS_RESERVATIONS',
      });
    }
    return this.prisma.space.delete({
      where: { id },
    });
  }
}
