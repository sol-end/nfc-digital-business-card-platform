import dotenv from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
dotenv.config({
  path: new URL('../.env', import.meta.url),
  override: true,
});
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const { AppModule } = await import('./../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body.service).toBe('nfc-business-card-api');
        expect(new Date(response.body.timestamp).toISOString()).toBe(
          response.body.timestamp,
        );
      });
  });
  it('/health/database (GET)', () => {
  return request(app.getHttpServer())
    .get('/health/database')
    .expect(200)
    .expect((response) => {
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
      expect(new Date(response.body.timestamp).toISOString()).toBe(
        response.body.timestamp,
      );
    });
  });
  afterEach(async () => {
    await app.close();
  });
});
