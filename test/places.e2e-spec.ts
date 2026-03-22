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
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(validPlace.name);
          expect(res.body.latitude).toBe(validPlace.latitude);
          expect(res.body.longitude).toBe(validPlace.longitude);
          expect(res.body).toHaveProperty('spaces');
          expect(res.body.spaces).toEqual([]);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
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
        .expect(400);
    });

    it('should return 400 for invalid payload (missing required fields)', () => {
      return request(app.getHttpServer())
        .post('/places')
        .set('x-api-key', apiKey)
        .send({ name: 'Incomplete' })
        .expect(400);
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
          expect(res.body.message).toBe(
            'A place with this name already exists',
          );
        });
    });
  });
});
