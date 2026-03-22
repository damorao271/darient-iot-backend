import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

const apiKey = process.env.API_KEY ?? 'e2e-test-api-key';

describe('SpacesController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const validPlace = {
    name: 'E2E Spaces Test Place',
    latitude: 40.4168,
    longitude: -3.7038,
  };

  const validSpace = {
    name: 'E2E Test Meeting Room',
    reference: 'E2E-MR-01',
    capacity: 8,
    description: 'E2E test space',
  };

  describe('GET /spaces/:id', () => {
    it('should return 200 with the space when it exists', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = createRes.body.data.id;

      const getRes = await request(app.getHttpServer())
        .get(`/spaces/${spaceId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(getRes.body.success).toBe(true);
      expect(getRes.body.statusCode).toBe(200);
      expect(getRes.body.message).toBe('Space retrieved successfully');
      expect(getRes.body.data).toMatchObject({
        id: spaceId,
        placeId,
        name: validSpace.name,
        reference: validSpace.reference,
        capacity: validSpace.capacity,
        description: validSpace.description,
      });
      expect(getRes.body.data).toHaveProperty('place');
      expect(getRes.body.data.place).toMatchObject({
        id: placeId,
        name: validPlace.name,
      });
      expect(getRes.body.data).toHaveProperty('reservations');
      expect(Array.isArray(getRes.body.data.reservations)).toBe(true);
      expect(getRes.body).toHaveProperty('timestamp');
      expect(getRes.body).toHaveProperty('path');

      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 with ERR_SPACE_NOT_FOUND when space does not exist', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = createRes.body.data.id;
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });

      return request(app.getHttpServer())
        .get(`/spaces/${spaceId}`)
        .set('x-api-key', apiKey)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Space not found');
          expect(res.body.errorCode).toBe('ERR_SPACE_NOT_FOUND');
        });
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/spaces/invalid-id')
        .set('x-api-key', apiKey)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toBe('Invalid ID format');
          expect(res.body.errorCode).toBe('ERR_INVALID_ID');
        });
    });

    it('should return 401 when API key is missing', () => {
      return request(app.getHttpServer())
        .get('/spaces/clp7x3k4e0000qy5y5y5y5y5y')
        .expect(401);
    });
  });
});
