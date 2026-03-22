import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreateSpaceDto } from './dto/create-space.dto';
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

  findAll() {
    return this.prisma.space.findMany({
      include: { place: true, reservations: true },
    });
  }

  findOne(id: string) {
    return this.prisma.space.findUniqueOrThrow({
      where: { id },
      include: { place: true, reservations: true },
    });
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

  remove(id: string) {
    return this.prisma.space.delete({
      where: { id },
    });
  }
}
