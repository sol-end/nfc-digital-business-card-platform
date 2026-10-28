import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './database/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return a healthy API response', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('nfc-business-card-api');
      expect(result.timestamp).toBeDefined();
    });

    it('should return a valid ISO timestamp', () => {
      const result = appController.getHealth();

      expect(new Date(result.timestamp).toISOString()).toBe(
        result.timestamp,
      );
    });
  });

  describe('getDatabaseHealth', () => {
    it('should query the database and return a healthy response', async () => {
      const result = await appController.getDatabaseHealth();

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(new Date(result.timestamp).toISOString()).toBe(
        result.timestamp,
      );
    });

    it('should reject when the database query fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('Database unavailable'),
      );

      await expect(appController.getDatabaseHealth()).rejects.toThrow(
        'Database unavailable',
      );
    });
  });
});
