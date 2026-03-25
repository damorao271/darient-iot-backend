import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AlertsQuerySchema = z.object({
  status: z.enum(['open', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export class AlertsQueryDto extends createZodDto(AlertsQuerySchema) {}
