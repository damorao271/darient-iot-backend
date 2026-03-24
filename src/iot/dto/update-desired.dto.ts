import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateDesiredSchema = z
  .object({
    co2AlertThreshold: z.number().int().min(400).max(5000).optional(),
    samplingIntervalSec: z.number().int().min(1).max(3600).optional(),
  })
  .refine((d) => d.co2AlertThreshold !== undefined || d.samplingIntervalSec !== undefined, {
    message: 'At least one field must be provided',
  });

export class UpdateDesiredDto extends createZodDto(UpdateDesiredSchema) {}
