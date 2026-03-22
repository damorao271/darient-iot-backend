import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** HH:mm (e.g. "14:30") or ISO 8601 timestamp (e.g. "2025-03-21T14:30:00.000Z") */
const timeSchema = z.union([
  z.string().regex(/^\d{1,2}:\d{2}$/, 'Invalid HH:mm format'),
  z.string().datetime(),
]);

export const CreateReservationSchema = z.object({
  spaceId: z.string().cuid(),
  placeId: z.string().cuid().optional(),
  clientEmail: z.string().email(),
  reservationDate: z.string().datetime(),
  startTime: timeSchema,
  endTime: timeSchema,
});

export class CreateReservationDto extends createZodDto(CreateReservationSchema) {}
