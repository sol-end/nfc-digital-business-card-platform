import dotenv from 'dotenv';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

dotenv.config({
  path: new URL('../.env', import.meta.url),
});

async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule, ObserveInstrument } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
