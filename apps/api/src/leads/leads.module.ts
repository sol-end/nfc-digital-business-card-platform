import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
