import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(50).optional(),
});

export class CreatePlaceDto extends createZodDto(CreatePlaceSchema) {}
