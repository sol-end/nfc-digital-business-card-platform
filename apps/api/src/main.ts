
import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';

import { AppModule, ObserveInstrument } from './app.module.js';

dotenv.config({
  path: new URL('../.env', import.meta.url),
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();