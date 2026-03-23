import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreatePlaceDto } from './dto/create-place.dto';
import type { UpdatePlaceDto } from './dto/update-place.dto';

function omitKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys)
    delete (result as Record<string, unknown>)[key as string];
  return result as Omit<T, K>;
}

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlaceDto: CreatePlaceDto) {
    const existing = await this.prisma.place.findFirst({
      where: { name: createPlaceDto.name },
    });
    if (existing) {
      throw new ConflictException({
        message: 'A place with this name already exists',
        errorCode: 'ERR_DUPLICATE_PLACE',
      });
    }

    return this.prisma.place.create({
      data: {
        name: createPlaceDto.name,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
        ...(createPlaceDto.timezone && { timezone: createPlaceDto.timezone }),
      },
      include: { spaces: true },
    });
  }

  findAll() {
    return this.prisma.place.findMany({
      include: { spaces: true },
    });
  }

  findOne(id: string) {
    return this.prisma.place.findUniqueOrThrow({
      where: { id },
      include: { spaces: true },
    });
  }

  async findSpacesByPlaceId(placeId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        spaces: {
          include: { reservations: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!place) {
      throw new NotFoundException({
        message: 'Place not found',
        errorCode: 'ERR_PLACE_NOT_FOUND',
      });
    }
    const { spaces, ...placeData } = place;
    return {
      place: placeData,
      spaces: spaces.map((space) => ({
        ...omitKeys(space, ['placeId']),
        reservations: space.reservations.map((r) =>
          omitKeys(r, ['spaceId', 'placeId']),
        ),
      })),
    };
  }

  update(id: string, updatePlaceDto: UpdatePlaceDto) {
    return this.prisma.place.update({
      where: { id },
      data: updatePlaceDto,
    });
  }

  remove(id: string) {
    return this.prisma.place.delete({
      where: { id },
    });
  }
}
