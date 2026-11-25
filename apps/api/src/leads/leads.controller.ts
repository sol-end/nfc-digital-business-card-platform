
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { Request } from 'express';
import { LeadSource, LeadStatus } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { LeadsService } from './leads.service.js';

class CreateLeadDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(/\S/, { message: 'Name cannot be empty' })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  message?: string;

  // Hidden form field used to detect basic automated submissions.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  websiteConfirm?: string;

  // Lead acquisition channel. Defaults to DIRECT when omitted.
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

}

class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}

const validation = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

type AuthRequest = Request & { userId: string };

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('public/:slug')
  submit(
    @Param('slug') slug: string,
    @Body(validation) body: CreateLeadDto,
  ) {
    return this.leads.submit(slug, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: AuthRequest) {
    return this.leads.list(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(validation) body: UpdateLeadStatusDto,
  ) {
    return this.leads.updateStatus(req.userId, id, body.status);
  }
}