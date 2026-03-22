import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const hhmmSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, 'Invalid HH:mm format')
  .refine((s) => {
    const [h, m] = s.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, 'Invalid time: hour must be 0-23, minutes must be 0-59');

const timeSchema = z.union([hhmmSchema, z.string().datetime()]);

const UpdateReservationSchema = z.object({
  spaceId: z.string().cuid().optional(),
  placeId: z.string().cuid().optional(),
  clientEmail: z.string().email().optional(),
  reservationDate: z.string().datetime().optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
});

export class UpdateReservationDto extends createZodDto(
  UpdateReservationSchema,
) {}
