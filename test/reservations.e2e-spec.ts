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
        startTime: '09:00',
        endTime: '10:00',
      });
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
      expect(res.body.data.startTime).toBe('10:00');
      expect(res.body.data.endTime).toBe('11:00');

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
});
