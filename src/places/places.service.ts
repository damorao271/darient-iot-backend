import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreatePlaceDto } from './dto/create-place.dto';
import type { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPlaceDto: CreatePlaceDto) {
    return this.prisma.place.create({
      data: createPlaceDto,
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
