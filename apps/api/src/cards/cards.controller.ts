
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Request } from 'express';
import { PartialType } from '@nestjs/mapped-types';
import { CardsService } from './cards.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

class CreateCardDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  website?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateCardDto extends PartialType(CreateCardDto) {}

const validation = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

type AuthRequest = Request & { userId: string };

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.cards.findPublic(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: AuthRequest,
    @Body(validation) body: CreateCardDto,
  ) {
    return this.cards.create(req.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: AuthRequest) {
    return this.cards.list(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.cards.findOne(req.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body(validation) body: UpdateCardDto,
  ) {
    return this.cards.update(req.userId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.cards.remove(req.userId, id);
  }
}