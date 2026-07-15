import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api, docs at /api/docs`);
}
void bootstrap();
