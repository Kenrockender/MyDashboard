import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/**
 * Parse the CORS_ORIGINS env var (comma-separated list of allowed origins).
 * When unset, falls back to localhost dev origin so local development keeps
 * working without extra config. In production, set CORS_ORIGINS to the web
 * app's real URL(s) so the API is not open to every origin on the internet.
 */
export function resolveCorsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGINS;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  return ['http://localhost:3000'];
}

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
