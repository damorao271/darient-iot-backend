import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { parseTimeToMinutes } from '../../common/utils/time.utils';

/** HH:mm with valid hour (0-23) and minute (0-59) */
const hhmmSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, 'Invalid HH:mm format')
  .refine((s) => {
    const [h, m] = s.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, 'Invalid time: hour must be 0-23, minutes must be 0-59');

const timeSchema = z.union([hhmmSchema, z.string().datetime()]);

export const CreateReservationSchema = z
  .object({
    spaceId: z.string().cuid(),
    placeId: z.string().cuid().optional(),
    clientEmail: z.string().email(),
    reservationDate: z.string().datetime(),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine(
    (data) =>
      parseTimeToMinutes(data.endTime) > parseTimeToMinutes(data.startTime),
    { message: 'endTime must be after startTime', path: ['endTime'] },
  );

export class CreateReservationDto extends createZodDto(
  CreateReservationSchema,
) {}
