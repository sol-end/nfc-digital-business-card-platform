import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CardsModule } from './cards/cards.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CardsModule,
    LeadsModule,

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),

    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'api',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
