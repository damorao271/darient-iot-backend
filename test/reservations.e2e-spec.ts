import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';

const apiKey = process.env.API_KEY ?? 'e2e-test-api-key';

describe('ReservationsController (e2e)', () => {
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
    name: 'E2E Reservations Test Place',
    latitude: 40.4168,
    longitude: -3.7038,
  };

  const validSpace = {
    name: 'E2E Reservation Meeting Room',
    reference: 'E2E-RMR-01',
    capacity: 6,
    description: 'E2E test space for reservations',
  };

  function reservationPayload(overrides: Record<string, unknown> = {}) {
    return {
      clientEmail: 'reservation-test@example.com',
      reservationDate: new Date().toISOString(),
      startTime: '09:00',
      endTime: '10:00',
      ...overrides,
    };
  }

  describe('POST /reservations', () => {
    it('should create a reservation and return 201', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const res = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload(),
          spaceId,
          placeId,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.message).toBe('Reservation created successfully');
      expect(res.body.data).toMatchObject({
        spaceId,
        clientEmail: 'reservation-test@example.com',
      });
      expect(res.body.data).toHaveProperty('startAt');
      expect(res.body.data).toHaveProperty('endAt');
      expect(res.body.data).toHaveProperty('space');

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 409 when schedule overlaps (ERR_SCHEDULE_CONFLICT)', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;
      const date = new Date().toISOString();

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'overlap@example.com',
          reservationDate: date,
          startTime: '09:00',
          endTime: '10:00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'overlap@example.com',
          reservationDate: date,
          startTime: '09:30',
          endTime: '10:30',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe(
            'This space is already reserved for the requested time slot',
          );
          expect(res.body.errorCode).toBe('ERR_SCHEDULE_CONFLICT');
        });

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should allow back-to-back reservations (border case: one starts when another ends)', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;
      const date = new Date().toISOString();

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'backtoback@example.com',
          reservationDate: date,
          startTime: '09:00',
          endTime: '10:00',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'backtoback@example.com',
          reservationDate: date,
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('startAt');
      expect(res.body.data).toHaveProperty('endAt');

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 409 when client exceeds 3 reservations per week (ERR_RESERVATION_LIMIT)', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const monday = new Date('2025-03-24T12:00:00.000Z');
      const weekDates = [
        new Date(monday),
        new Date(monday.getTime() + 24 * 60 * 60 * 1000),
        new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000),
        new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000),
      ];

      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/reservations')
          .set('x-api-key', apiKey)
          .send({
            spaceId,
            placeId,
            clientEmail: 'limit-test@example.com',
            reservationDate: weekDates[i].toISOString(),
            startTime: `${9 + i}:00`,
            endTime: `${10 + i}:00`,
          })
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'limit-test@example.com',
          reservationDate: weekDates[3].toISOString(),
          startTime: '14:00',
          endTime: '15:00',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe(
            'Client has reached the maximum of 3 reservations per week',
          );
          expect(res.body.errorCode).toBe('ERR_RESERVATION_LIMIT');
        });

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 when space does not exist', () => {
      const nonExistentSpaceId = 'clp00000000000000000000000';

      return request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload(),
          spaceId: nonExistentSpaceId,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Space not found');
          expect(res.body.errorCode).toBe('ERR_SPACE_NOT_FOUND');
        });
    });

    it('should return 400 when endTime is not after startTime', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'test@example.com',
          reservationDate: new Date().toISOString(),
          startTime: '10:00',
          endTime: '09:00',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(400);
          expect(res.body).toHaveProperty('details');
        });

      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 400 for invalid payload', () => {
      return request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId: 'clp7x3k4e0000qy5y5y5y5y5y',
          clientEmail: 'not-an-email',
          reservationDate: new Date().toISOString(),
          startTime: '09:00',
          endTime: '10:00',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(400);
        });
    });

    it('should return 401 when API key is missing', () => {
      return request(app.getHttpServer())
        .post('/reservations')
        .send(reservationPayload({ spaceId: 'clp7x3k4e0000qy5y5y5y5y5y' }))
        .expect(401);
    });
  });

  describe('GET /reservations', () => {
    it('should return 401 when API key is missing', () => {
      return request(app.getHttpServer()).get('/reservations').expect(401);
    });

    it('should return paginated list with default pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/reservations')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toMatchObject({
        page: 1,
        pageSize: 10,
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should respect page and pageSize query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/reservations?page=2&pageSize=5')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.meta).toMatchObject({
        page: 2,
        pageSize: 5,
      });
    });

    it('should filter by spaceId', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload(),
          spaceId,
          placeId,
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get(`/reservations?spaceId=${spaceId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(
        listRes.body.data.items.every(
          (r: { spaceId: string }) => r.spaceId === spaceId,
        ),
      ).toBe(true);

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should filter by clientEmail', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const uniqueEmail = `filter-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload({ clientEmail: uniqueEmail }),
          spaceId,
          placeId,
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get(`/reservations?clientEmail=${encodeURIComponent(uniqueEmail)}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(
        listRes.body.data.items.every(
          (r: { clientEmail: string }) => r.clientEmail === uniqueEmail,
        ),
      ).toBe(true);

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should filter by fromDate and toDate', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const fixedDate = '2025-03-22';
      await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload({
            reservationDate: `${fixedDate}T12:00:00.000Z`,
          }),
          spaceId,
          placeId,
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get(`/reservations?fromDate=2025-03-22&toDate=2025-03-22`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(
        listRes.body.data.items.some(
          (r: { reservationDate: string }) =>
            r.reservationDate === '2025-03-22',
        ),
      ).toBe(true);

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should support sortBy and sortOrder', async () => {
      const ascRes = await request(app.getHttpServer())
        .get('/reservations?sortBy=clientEmail&sortOrder=asc&pageSize=5')
        .set('x-api-key', apiKey)
        .expect(200);

      const descRes = await request(app.getHttpServer())
        .get('/reservations?sortBy=clientEmail&sortOrder=desc&pageSize=5')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(ascRes.body.success).toBe(true);
      expect(descRes.body.success).toBe(true);

      if (
        ascRes.body.data.items.length >= 2 &&
        descRes.body.data.items.length >= 2
      ) {
        const ascEmails = ascRes.body.data.items.map(
          (r: { clientEmail: string }) => r.clientEmail,
        );
        const descEmails = descRes.body.data.items.map(
          (r: { clientEmail: string }) => r.clientEmail,
        );
        expect(ascEmails[0] <= ascEmails[1]).toBe(true);
        expect(descEmails[0] >= descEmails[1]).toBe(true);
      }
    });

    it('should return 400 when fromDate is after toDate', () => {
      return request(app.getHttpServer())
        .get('/reservations?fromDate=2025-03-25&toDate=2025-03-20')
        .set('x-api-key', apiKey)
        .expect(400);
    });
  });

  describe('PATCH /reservations/:id', () => {
    it('should return 409 when update causes schedule conflict', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;
      const date = new Date().toISOString();

      const res1 = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'update-conflict@example.com',
          reservationDate: date,
          startTime: '09:00',
          endTime: '10:00',
        })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          clientEmail: 'update-conflict@example.com',
          reservationDate: date,
          startTime: '11:00',
          endTime: '12:00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/reservations/${res2.body.data.id}`)
        .set('x-api-key', apiKey)
        .send({ startTime: '09:30', endTime: '10:30' })
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.errorCode).toBe('ERR_SCHEDULE_CONFLICT');
        });

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 409 when update has endTime before startTime', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          spaceId,
          placeId,
          ...reservationPayload(),
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/reservations/${createRes.body.data.id}`)
        .set('x-api-key', apiKey)
        .send({ startTime: '10:00', endTime: '09:00' })
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.errorCode).toBe('ERR_INVALID_TIME_RANGE');
        });

      await prisma.reservation.deleteMany({ where: { spaceId } });
      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });
  });

  describe('DELETE /reservations/:id', () => {
    it('should delete a reservation and return 200', async () => {
      const placeRes = await request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send(validPlace)
        .expect(201);

      const placeId = placeRes.body.data.id;

      const spaceRes = await request(app.getHttpServer())
        .post('/spaces')
        .set('x-api-key', apiKey)
        .send({ ...validSpace, placeId })
        .expect(201);

      const spaceId = spaceRes.body.data.id;

      const createRes = await request(app.getHttpServer())
        .post('/reservations')
        .set('x-api-key', apiKey)
        .send({
          ...reservationPayload(),
          spaceId,
          placeId,
        })
        .expect(201);

      const reservationId = createRes.body.data.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/reservations/${reservationId}`)
        .set('x-api-key', apiKey)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Reservation deleted successfully');
      expect(deleteRes.body.data).toMatchObject({ id: reservationId });

      await prisma.space.delete({ where: { id: spaceId } });
      await prisma.place.delete({ where: { id: placeId } });
    });

    it('should return 404 when reservation does not exist', () => {
      const nonExistentId = 'clp00000000000000000000000';

      return request(app.getHttpServer())
        .delete(`/reservations/${nonExistentId}`)
        .set('x-api-key', apiKey)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Reservation not found');
          expect(res.body.errorCode).toBe('ERR_RESERVATION_NOT_FOUND');
        });
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer())
        .delete('/reservations/invalid-id')
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
        .delete('/reservations/clp7x3k4e0000qy5y5y5y5y5y')
        .expect(401);
    });
  });
});
