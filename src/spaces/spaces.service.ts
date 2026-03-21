import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreateSpaceDto } from './dto/create-space.dto';
import type { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSpaceDto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: createSpaceDto as Prisma.SpaceUncheckedCreateInput,
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

  update(id: string, updateSpaceDto: UpdateSpaceDto) {
    return this.prisma.space.update({
      where: { id },
      data: updateSpaceDto,
    });
  }

  remove(id: string) {
    return this.prisma.space.delete({
      where: { id },
    });
  }
}
