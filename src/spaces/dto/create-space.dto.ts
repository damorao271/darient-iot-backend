import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = () =>
  z
    .string()
    .regex(TIME_RE, 'Must be HH:mm format (e.g. 09:00)')
    .optional();

const CreateSpaceSchema = z
  .object({
    placeId: z.string().cuid(),
    name: z.string().min(1).max(100),
    reference: z.string().max(25).optional(),
    capacity: z.number().int().positive(),
    description: z.string().max(500).optional(),
    openTime: timeField(),
    closeTime: timeField(),
  })
  .refine(
    (d) => {
      if (d.openTime && d.closeTime) return d.openTime < d.closeTime;
      return true;
    },
    { message: 'openTime must be before closeTime', path: ['closeTime'] },
  )
  .refine(
    (d) => (d.openTime === undefined) === (d.closeTime === undefined),
    { message: 'openTime and closeTime must both be set or both omitted', path: ['openTime'] },
  );

export class CreateSpaceDto extends createZodDto(CreateSpaceSchema) {}
