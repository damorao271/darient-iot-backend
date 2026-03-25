import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const TelemetryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export class TelemetryQueryDto extends createZodDto(TelemetryQuerySchema) {}
