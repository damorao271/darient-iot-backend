import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateSpaceSchema = z.object({
  placeId: z.string().cuid().optional(),
  name: z.string().min(1).max(100).optional(),
  reference: z.string().max(500).optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

export class UpdateSpaceDto extends createZodDto(UpdateSpaceSchema) {}
