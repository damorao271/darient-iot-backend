import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateReservationSchema = z.object({
  spaceId: z.string().cuid(),
  placeId: z.string().cuid().optional(),
  clientEmail: z.string().email(),
  reservationDate: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export class CreateReservationDto extends createZodDto(CreateReservationSchema) {}
