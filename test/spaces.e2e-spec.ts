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

  const validPlace = () => ({
    name: `E2E Spaces Test Place ${Date.now()}`,
    latitude: 40.4168,
    longitude: -3.7038,
  });

  const validSpace = {
    name: 'E2E Test Meeting Room',
    reference: 'E2E-MR-01',
    capacity: 8,
    description: 'E2E test space',
  };

  describe('GET /spaces', () => {
    it('should return 200 with paginated spaces and default sort', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.message).toBe('Spaces retrieved successfully');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.meta).toMatchObject({
        page: 1,
        pageSize: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });

    it('should respect pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces?page=2&pageSize=5')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.meta.page).toBe(2);
      expect(res.body.data.meta.pageSize).toBe(5);
      expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    });

    it('should sort by capacity descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces?sortBy=capacity&sortOrder=desc')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.meta.sortBy).toBe('capacity');
      expect(res.body.data.meta.sortOrder).toBe('desc');
      if (res.body.data.items.length >= 2) {
        const capacities = res.body.data.items.map(
          (s: { capacity: number }) => s.capacity,
        );
        for (let i = 1; i < capacities.length; i++) {
          expect(capacities[i]).toBeLessThanOrEqual(capacities[i - 1]);
        }
      }
    });

    it('should filter by name (partial, case-insensitive)', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces?name=meeting')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.meta).toHaveProperty('name', 'meeting');
      if (res.body.data.items.length > 0) {
        res.body.data.items.forEach((s: { name: string }) => {
          expect(s.name.toLowerCase()).toContain('meeting');
        });
      }
    });

    it('should filter spaces with reservations', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces?hasReservations=true')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.meta.hasReservations).toBe(true);
      res.body.data.items.forEach((s: { reservations: unknown[] }) => {
        expect(s.reservations.length).toBeGreaterThan(0);
      });
    });

    it('should filter spaces without reservations', async () => {
      const res = await request(app.getHttpServer())
        .get('/spaces?hasReservations=false')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.data.meta.hasReservations).toBe(false);
      res.body.data.items.forEach((s: { reservations: unknown[] }) => {
        expect(s.reservations).toHaveLength(0);
      });
    });

    it('should return 401 when API key is missing', () => {
      return request(app.getHttpServer()).get('/spaces').expect(401);
    });
  });

  describe('GET /spaces/:id', () => {
    it('should return 200 with the space when it exists', async () => {
      const place = validPlace();
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(place)
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
        name: place.name,
      });
      expect(getRes.body.data).toHaveProperty('reservations');
      expect(Array.isArray(getRes.body.data.reservations)).toBe(true);
      expect(getRes.body).toHaveProperty('timestamp');
      expect(getRes.body).toHaveProperty('path');

      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 with ERR_SPACE_NOT_FOUND when space does not exist', async () => {
      const place = validPlace();
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(place)
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

  describe('DELETE /spaces/:id', () => {
    it('should return 200 when deleting a space without reservations', async () => {
      const place = validPlace();
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(place)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = createRes.body.data.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/spaces/${spaceId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Space deleted successfully');

      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 409 when deleting a space with reservations', async () => {
      const place = validPlace();
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(place)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = createRes.body.data.id;

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'test@example.com',
          reservationDate: new Date().toISOString(),
          startTime: '09:00',
          endTime: '10:00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/spaces/${spaceId}`)
        .set('x-api-key', apiKey)
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe(
            'Cannot delete space with active reservations',
          );
          expect(res.body.errorCode).toBe('ERR_SPACE_HAS_RESERVATIONS');
        });

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 when space does not exist', async () => {
      const nonExistentId = 'clp00000000000000000000000';

      return request(app.getHttpServer())
        .delete(`/spaces/${nonExistentId}`)
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
        .delete('/spaces/invalid-id')
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
        .delete('/spaces/clp7x3k4e0000qy5y5y5y5y5y')
        .expect(401);
    });
  });
});
