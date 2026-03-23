import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PlacesSpacesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'capacity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class PlacesSpacesQueryDto extends createZodDto(PlacesSpacesQuerySchema) {}

export type PlacesSpacesQuery = z.infer<typeof PlacesSpacesQuerySchema>;
