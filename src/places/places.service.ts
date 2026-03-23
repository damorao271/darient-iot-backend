import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreatePlaceDto } from './dto/create-place.dto';
import type { PlacesSpacesQuery } from './dto/places-spaces-query.dto';
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

function serializePlace<
  T extends { _count: { spaces: number }; spaces?: { capacity: number }[] },
>(
  place: T,
): Omit<T, '_count' | 'spaces'> & { spaceCount: number; totalCapacity: number } {
  const { _count, spaces = [], ...rest } = place;
  const totalCapacity = spaces.reduce((sum, s) => sum + s.capacity, 0);
  return { ...rest, spaceCount: _count.spaces, totalCapacity };
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

    const created = await this.prisma.place.create({
      data: {
        name: createPlaceDto.name,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
        ...(createPlaceDto.timezone && { timezone: createPlaceDto.timezone }),
      },
      include: { _count: { select: { spaces: true } } },
    });
    return serializePlace(created);
  }

  async findAll() {
    const places = await this.prisma.place.findMany({
      include: {
        _count: { select: { spaces: true } },
        spaces: { select: { capacity: true } },
      },
    });
    return places.map(serializePlace);
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { spaces: true } },
        spaces: { select: { capacity: true } },
      },
    });
    return serializePlace(place);
  }

  async findSpacesByPlaceId(placeId: string, query?: PlacesSpacesQuery) {
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
      },
    });
    if (!place) {
      throw new NotFoundException({
        message: 'Place not found',
        errorCode: 'ERR_PLACE_NOT_FOUND',
      });
    }

    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 10));
    const sortBy = query?.sortBy ?? 'name';
    const sortOrder = query?.sortOrder ?? 'asc';
    const skip = (page - 1) * pageSize;
    const orderBy =
      sortBy === 'name' ? { name: sortOrder } : { capacity: sortOrder };

    const where = { placeId };
    const now = new Date();

    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          _count: {
            select: {
              reservations: { where: { startAt: { gt: now } } },
            },
          },
          reservations: {
            where: { startAt: { gt: now } },
            orderBy: { startAt: 'asc' as const },
            take: 3,
          },
        },
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      place: { ...place, totalSpaces: total },
      items: spaces.map(({ _count, reservations, ...space }) => ({
        ...omitKeys(space, ['placeId']),
        reservationCount: _count.reservations,
        reservations,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        sortBy,
        sortOrder,
      },
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
