import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateSpaceSchema = z.object({
  placeId: z.string().cuid(),
  name: z.string().min(1).max(100),
  reference: z.string().max(500).optional(),
  capacity: z.number().int().positive(),
  description: z.string().max(500).optional(),
});

export class CreateSpaceDto extends createZodDto(CreateSpaceSchema) {}
