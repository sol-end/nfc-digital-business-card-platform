
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CardsController } from './cards.controller.js';
import { CardsService } from './cards.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}