import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlacesService } from './places.service';

const mockPlaceDelegate = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

jest.mock('../common/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    place: mockPlaceDelegate,
  })),
}));

import { PrismaService } from '../common/prisma/prisma.service';

describe('PlacesService', () => {
  let service: PlacesService;

  const mockPlace = {
    id: 'clxy123',
    name: 'Office',
    latitude: 40.4168,
    longitude: -3.7038,
    spaces: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPlaceDelegate.findFirst.mockReset();
    mockPlaceDelegate.create.mockReset();
    mockPlaceDelegate.findFirst.mockResolvedValue(null);
    mockPlaceDelegate.create.mockResolvedValue(mockPlace);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacesService,
        {
          provide: PrismaService,
          useValue: { place: mockPlaceDelegate },
        },
      ],
    }).compile();

    service = module.get<PlacesService>(PlacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPlaceDto = {
      name: 'Office',
      latitude: 40.4168,
      longitude: -3.7038,
    };

    it('should create a place with valid input', async () => {
      const result = await service.create(createPlaceDto);

      expect(mockPlaceDelegate.findFirst).toHaveBeenCalledWith({
        where: { name: createPlaceDto.name },
      });
      expect(mockPlaceDelegate.create).toHaveBeenCalledWith({
        data: {
          name: createPlaceDto.name,
          latitude: createPlaceDto.latitude,
          longitude: createPlaceDto.longitude,
        },
        include: { spaces: true },
      });
      expect(result).toEqual(mockPlace);
    });

    it('should return place with spaces array', async () => {
      const result = await service.create(createPlaceDto);

      expect(result).toHaveProperty('spaces');
      expect(result.spaces).toEqual([]);
    });

    it('should throw ConflictException when place name already exists', async () => {
      mockPlaceDelegate.findFirst.mockResolvedValue(mockPlace);

      await expect(service.create(createPlaceDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createPlaceDto)).rejects.toThrow(
        'A place with this name already exists',
      );
      expect(mockPlaceDelegate.create).not.toHaveBeenCalled();
    });
  });
});
