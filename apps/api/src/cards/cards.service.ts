
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

export type CardInput = {
  slug: string;
  fullName: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  isActive?: boolean;
};

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async handleUnique<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This card URL is already taken');
      }
      throw error;
    }
  }

  create(ownerId: string, data: CardInput) {
    return this.handleUnique(() =>
      this.prisma.businessCard.create({
        data: { ...data, ownerId },
      }),
    );
  }

  list(ownerId: string) {
    return this.prisma.businessCard.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const card = await this.prisma.businessCard.findFirst({
      where: { id, ownerId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async update(
    ownerId: string,
    id: string,
    data: Partial<CardInput>,
  ) {
    return this.handleUnique(async () => {
      const result = await this.prisma.businessCard.updateMany({
        where: { id, ownerId },
        data,
      });

      if (result.count === 0) {
        throw new NotFoundException('Card not found');
      }

      return this.findOne(ownerId, id);
    });
  }

  async remove(ownerId: string, id: string) {
    // Soft delete: preserves existing leads and analytics.
    const result = await this.prisma.businessCard.updateMany({
      where: { id, ownerId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('Card not found');
    }

    return { success: true };
  }

  async findPublic(slug: string) {
    const card = await this.prisma.businessCard.findFirst({
      where: { slug, isActive: true },
      select: {
        slug: true,
        fullName: true,
        jobTitle: true,
        company: true,
        bio: true,
        email: true,
        phone: true,
        website: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }
}