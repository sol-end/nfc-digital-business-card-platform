
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

dotenv.config({
  path: new URL('../.env', import.meta.url),
  override: true,
});

import type { PrismaService } from '../src/database/prisma.service.js';

describe('LeadsController (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const prismaMock = {
    businessCard: {
      findFirst: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.businessCard.findFirst.mockResolvedValue({
      id: 'card-123',
    });

    prismaMock.lead.findFirst.mockResolvedValue(null);

    prismaMock.lead.create.mockResolvedValue({
      id: 'lead-123',
      createdAt: new Date('2026-11-03T12:00:00.000Z'),
    });

    prismaMock.lead.findMany.mockResolvedValue([]);

    // Load the application only after loading its environment variables.
    const { AppModule } = await import('../src/app.module.js');
    const { PrismaService } = await import(
      '../src/database/prisma.service.js'
    );

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // Match the global validation configuration in main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    jwt = app.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /leads/public/:slug', () => {
    it('accepts a valid lead submission', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1 202 555 0123',
          message: 'Please contact me.',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        lead: {
          id: 'lead-123',
          createdAt: '2026-11-03T12:00:00.000Z',
        },
      });

      expect(prismaMock.lead.create).toHaveBeenCalledTimes(1);
    });

    it('rejects an invalid email address', async () => {
      await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Test User',
          email: 'not-an-email',
        })
        .expect(400);

      expect(prismaMock.businessCard.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('rejects a submission without a name', async () => {
      await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('rejects a submission without email or phone', async () => {
      await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Test User',
        })
        .expect(400);

      expect(prismaMock.businessCard.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          unexpectedField: 'not allowed',
        })
        .expect(400);

      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('does not create a database record when the honeypot is filled', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Automated Bot',
          email: 'bot@example.com',
          websiteConfirm: 'https://spam.example.com',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        lead: null,
      });

      expect(prismaMock.businessCard.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('does not create a duplicate lead', async () => {
      prismaMock.lead.findFirst.mockResolvedValue({
        id: 'existing-lead-123',
      });

      const response = await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Existing Contact',
          email: 'existing@example.com',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        duplicate: true,
      });

      expect(prismaMock.lead.create).not.toHaveBeenCalled();
    });

    it('returns 429 after five public submissions in one minute', async () => {
      // The mock returns no card, so the first five requests return 404.
      // They still count toward the route's rate limit.
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/leads/public/test-card')
          .send({
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
          })
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/leads/public/test-card')
        .send({
          name: 'Sixth User',
          email: 'sixth@example.com',
        })
        .expect(429);
    });
  });

  describe('GET /leads', () => {
    it('rejects requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/leads')
        .expect(401);

      expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
    });

    it('allows an authenticated user to retrieve their leads', async () => {
      const token = await jwt.signAsync({
        sub: 'owner-123',
      });

      prismaMock.lead.findMany.mockResolvedValue([
        {
          id: 'lead-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('lead-123');

      expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            card: {
              ownerId: 'owner-123',
            },
          },
        }),
      );
    });

    it('rejects an invalid JWT', async () => {
      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
    });
  });
});
