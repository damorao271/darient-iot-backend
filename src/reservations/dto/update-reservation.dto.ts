import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** HH:mm (e.g. "14:30") or ISO 8601 timestamp (e.g. "2025-03-21T14:30:00.000Z") */
const timeSchema = z.union([
  z.string().regex(/^\d{1,2}:\d{2}$/, 'Invalid HH:mm format'),
  z.string().datetime(),
]);

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
