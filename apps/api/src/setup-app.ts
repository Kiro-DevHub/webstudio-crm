import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

/**
 * Shared app configuration used by main.ts and e2e tests,
 * so tests exercise the exact production pipeline.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // The web app is deployed on a different host (e.g. Vercel) than the API, so browser
  // requests are cross-origin; CORS must be explicit and echo credentials for the auth cookie.
  // CORS_ORIGIN is a comma-separated allow-list; unset (local dev, same-origin via Vite proxy) allows all.
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WebStudio CRM API')
    .setDescription('CRM for a web studio: clients, deals, tasks, analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
