import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = () =>
  z
    .string()
    .regex(TIME_RE, 'Must be HH:mm format (e.g. 09:00)')
    .nullable()
    .optional();

const UpdateSpaceSchema = z.object({
  placeId: z.string().cuid().optional(),
  name: z.string().min(1).max(100).optional(),
  reference: z.string().max(25).optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
  openTime: timeField(),
  closeTime: timeField(),
});

export class UpdateSpaceDto extends createZodDto(UpdateSpaceSchema) {}
