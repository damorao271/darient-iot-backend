import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateReservationSchema = z.object({
  spaceId: z.string().cuid().optional(),
  placeId: z.string().cuid().optional(),
  clientEmail: z.string().email().optional(),
  reservationDate: z.coerce.date().optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservationSchema) {}
