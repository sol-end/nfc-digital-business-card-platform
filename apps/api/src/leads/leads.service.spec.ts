import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadSource, LeadStatus } from '../generated/prisma/client.js';
import { LeadsService } from './leads.service.js';
import type { PrismaService } from '../database/prisma.service.js';

describe('LeadsService', () => {
  let service: LeadsService;

  const prisma = {
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

  beforeEach(() => {
    jest.clearAllMocks();

    service = new LeadsService(
      prisma as unknown as PrismaService,
    );
  });

  describe('submit', () => {
    it('rejects a submission without an email or phone number', async () => {
      await expect(
        service.submit('test-card', {
          name: 'Test User',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.businessCard.findFirst).not.toHaveBeenCalled();
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('does not save a submission when the honeypot is filled', async () => {
      const result = await service.submit('test-card', {
        name: 'Spam Bot',
        email: 'spam@example.com',
        websiteConfirm: 'https://spam.example.com',
      });

      expect(result).toEqual({
        success: true,
        lead: null,
      });

      expect(prisma.businessCard.findFirst).not.toHaveBeenCalled();
      expect(prisma.lead.findFirst).not.toHaveBeenCalled();
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('rejects a submission for a nonexistent or inactive card', async () => {
      prisma.businessCard.findFirst.mockResolvedValue(null);

      await expect(
        service.submit('inactive-card', {
          name: 'Test User',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('does not create a duplicate lead within the duplicate-check window', async () => {
      prisma.businessCard.findFirst.mockResolvedValue({
        id: 'card-123',
      });

      prisma.lead.findFirst.mockResolvedValue({
        id: 'existing-lead-123',
      });

      const result = await service.submit('test-card', {
        name: 'Test User',
        email: 'TEST@example.com',
      });

      expect(result).toEqual({
        success: true,
        duplicate: true,
      });

      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('creates a lead with normalized contact information', async () => {
      prisma.businessCard.findFirst.mockResolvedValue({
        id: 'card-123',
      });

      prisma.lead.findFirst.mockResolvedValue(null);

      prisma.lead.create.mockResolvedValue({
        id: 'lead-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '12025550123',
        message: 'Please contact me.',
        status: LeadStatus.NEW,
        source: LeadSource.DIRECT,
      });

      const result = await service.submit('test-card', {
        name: '  Test User  ',
        email: ' TEST@EXAMPLE.COM ',
        phone: ' +1 (202) 555-0123 ',
        message: ' Please contact me. ',
      });

      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: 'card-123',
          name: 'Test User',
          email: 'test@example.com',
          phone: '12025550123',
          message: 'Please contact me.',
          source: LeadSource.DIRECT,
        }),
        select: {
          id: true,
          createdAt: true,
        },
      });

      expect(result).toEqual({
        success: true,
        lead: {
        id: 'lead-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '12025550123',
        message: 'Please contact me.',
        status: LeadStatus.NEW,
        source: LeadSource.DIRECT,
        }
      });
    });
  });
});