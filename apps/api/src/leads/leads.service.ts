
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

import {
  LeadSource,
  LeadStatus,
} from '../generated/prisma/client.js';

export type CreateLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: LeadSource;
  websiteConfirm?: string;
};

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(slug: string, data: CreateLeadInput) {
    // Basic honeypot: bots may fill hidden fields that real visitors never see.
    // Return a generic success response without creating a database record.
    if (data.websiteConfirm?.trim()) {
      return { success: true, lead: null };
    }

    const name = data.name.trim();
    const email = data.email?.trim().toLowerCase() || null;

    // Store phone numbers consistently for duplicate matching.
    const phoneDigits = data.phone?.replace(/\D/g, '') || '';
    const phone = phoneDigits || null;

    if (!name) {
      throw new BadRequestException('Please provide your name');
    }

    if (!email && !phone) {
      throw new BadRequestException(
        'Please provide an email address or phone number',
      );
    }

    const card = await this.prisma.businessCard.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });

    if (!card) {
      throw new NotFoundException('Business card not found');
    }

    // Check whether this contact submitted to this card in the last 10 minutes.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const duplicateConditions = [
      ...(email
        ? [{ email: { equals: email, mode: 'insensitive' as const } }]
        : []),
      ...(phone ? [{ phone }] : []),
    ];

    const existingLead = await this.prisma.lead.findFirst({
      where: {
        cardId: card.id,
        createdAt: { gte: tenMinutesAgo },
        OR: duplicateConditions,
      },
      select: { id: true },
    });

    if (existingLead) {
      // Do not reveal whether the contact already exists.
      return { success: true, duplicate: true };
    }

    const lead = await this.prisma.lead.create({
      data: {
        cardId: card.id,
        name,
        email,
        phone,
        message: data.message?.trim() || null,
        source: data.source ?? LeadSource.DIRECT,
      },
      select: { id: true, createdAt: true },
    });

    return { success: true, lead };
  }

  list(ownerId: string) {
    return this.prisma.lead.findMany({
      where: {
        card: { ownerId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        status: true,
        source: true,
        createdAt: true,
        card: {
          select: {
            slug: true,
            fullName: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateStatus(
    ownerId: string,
    leadId: string,
    status: LeadStatus,
  ) {
    const result = await this.prisma.lead.updateMany({
      where: {
        id: leadId,
        card: { ownerId },
      },
      data: { status },
    });

    if (result.count === 0) {
      throw new NotFoundException('Lead not found');
    }

    return { success: true };
  }
}