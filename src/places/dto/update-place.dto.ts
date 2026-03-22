import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdatePlaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export class UpdatePlaceDto extends createZodDto(UpdatePlaceSchema) {}
