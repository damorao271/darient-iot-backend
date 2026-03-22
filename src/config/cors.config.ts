import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_DEFAULT_ORIGINS = ['http://localhost:5173'];

function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  const origins = raw
    ? raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : null;

  if (process.env.NODE_ENV === 'production') {
    if (!origins || origins.length === 0) {
      throw new Error(
        'CORS_ORIGIN must be set in production (comma-separated list of allowed origins)',
      );
    }
    return origins;
  }

  return origins ?? DEV_DEFAULT_ORIGINS;
}

export function getCorsConfig(): CorsOptions {
  return {
    origin: getCorsOrigins(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}
