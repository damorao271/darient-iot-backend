import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

const apiKey = process.env.API_KEY ?? 'e2e-test-api-key';

describe('PlacesController (e2e)', () => {
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
    name: 'E2E Test Place',
    latitude: 40.4168,
    longitude: -3.7038,
  };

  describe('POST /places', () => {
    afterEach(async () => {
      await prisma.place.deleteMany({ where: { name: validPlace.name } });
    });

    it('should create a place and return 201 with the created place', () => {
      return request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.statusCode).toBe(201);
          expect(res.body.message).toBe('Place created successfully');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe(validPlace.name);
          expect(res.body.data.latitude).toBe(validPlace.latitude);
          expect(res.body.data.longitude).toBe(validPlace.longitude);
          expect(res.body.data).toHaveProperty('spaces');
          expect(res.body.data.spaces).toEqual([]);
          expect(res.body.data).toHaveProperty('createdAt');
          expect(res.body.data).toHaveProperty('updatedAt');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });

    it('should return 400 for invalid payload (latitude out of range)', () => {
      return request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({
          name: 'Invalid Place',
          latitude: 999,
          longitude: -3.7038,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(400);
          expect(res.body).toHaveProperty('details');
          expect(res.body).toHaveProperty('errorCode', 'ERR_VALIDATION');
        });
    });

    it('should return 400 for invalid payload (missing required fields)', () => {
      return request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({ name: 'Incomplete' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(400);
          expect(res.body).toHaveProperty('details');
          expect(res.body).toHaveProperty('errorCode', 'ERR_VALIDATION');
        });
    });

    it('should return 409 when place name already exists', async () => {
      await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace);

      return request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe(
            'A place with this name already exists',
          );
        });
    });
  });

  describe('GET /places/:placeId/spaces', () => {
    it('should return 200 with spaces belonging to the place', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({
          name: `E2E Spaces By Place ${Date.now()}`,
          latitude: 40.4168,
          longitude: -3.7038,
        })
        .expect(201);

      const placeId = createRes.body.data.id;

      await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({
          placeId,
          name: 'Room A',
          capacity: 4,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({
          placeId,
          name: 'Room B',
          capacity: 6,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/places/${placeId}/spaces`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Spaces retrieved successfully');
      expect(res.body.data).toHaveProperty('place');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.place.id).toBe(placeId);
      expect(res.body.data.place.totalSpaces).toBe(2);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(
        res.body.data.items.map((s: { name: string }) => s.name).sort(),
      ).toEqual(['Room A', 'Room B']);
      expect(res.body.data.meta).toMatchObject({
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      });
      res.body.data.items.forEach(
        (space: { placeId?: string; place?: unknown; reservations?: Array<Record<string, unknown>> }) => {
          expect(space).not.toHaveProperty('placeId');
          expect(space).not.toHaveProperty('place');
          expect(space).toHaveProperty('reservations');
          space.reservations?.forEach((r: Record<string, unknown>) => {
            expect(r).not.toHaveProperty('spaceId');
            expect(r).not.toHaveProperty('placeId');
          });
        },
      );

      await prisma.space.deleteMany({ where: { placeId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 200 with empty array when place has no spaces', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({
          name: `E2E Place No Spaces ${Date.now()}`,
          latitude: 40.4168,
          longitude: -3.7038,
        })
        .expect(201);

      const placeId = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/places/${placeId}/spaces`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.place.id).toBe(placeId);
      expect(res.body.data.place.totalSpaces).toBe(0);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.meta.total).toBe(0);

      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should respect pagination params', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({
          name: `E2E Pagination Place ${Date.now()}`,
          latitude: 40.4168,
          longitude: -3.7038,
        })
        .expect(201);

      const placeId = createRes.body.data.id;

      await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ placeId, name: 'Room A', capacity: 4 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ placeId, name: 'Room B', capacity: 5 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ placeId, name: 'Room C', capacity: 6 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/places/${placeId}/spaces?page=2&pageSize=2&sortBy=name&sortOrder=asc`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.place.totalSpaces).toBe(3);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe('Room C');
      expect(res.body.data.meta).toMatchObject({
        page: 2,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });

      await prisma.space.deleteMany({ where: { placeId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 when place does not exist', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxx';

      return request(app.getHttpServer())
        .get(`/places/${fakeId}/spaces`)
        .set('x-api-key', apiKey)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(404);
        });
    });
  });
});
