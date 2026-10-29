import dotenv from 'dotenv';

dotenv.config({
  path: new URL('../.env', import.meta.url),
});

async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule, ObserveInstrument } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();