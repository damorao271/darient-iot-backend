import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreatePlaceDto } from './dto/create-place.dto';
import type { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlaceDto: CreatePlaceDto) {
    const existing = await this.prisma.place.findFirst({
      where: { name: createPlaceDto.name },
    });
    if (existing) {
      throw new ConflictException('A place with this name already exists');
    }

    return this.prisma.place.create({
      data: {
        name: createPlaceDto.name,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
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
