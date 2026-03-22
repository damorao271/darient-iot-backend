import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SpacesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'capacity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  name: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v === '' || !v?.trim() ? undefined : v.trim())),
  hasReservations: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export class SpacesQueryDto extends createZodDto(SpacesQuerySchema) {}

export type SpacesQuery = z.infer<typeof SpacesQuerySchema>;
