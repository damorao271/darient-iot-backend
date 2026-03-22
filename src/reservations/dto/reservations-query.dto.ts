import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ReservationsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['startAt', 'createdAt', 'clientEmail']).default('startAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    spaceId: z.string().cuid().optional(),
    placeId: z.string().cuid().optional(),
    clientEmail: z
      .string()
      .email()
      .optional()
      .transform((v) => (v === '' || !v?.trim() ? undefined : v.trim())),
    fromDate: z
      .string()
      .regex(ISO_DATE_REGEX, 'Must be YYYY-MM-DD')
      .optional()
      .transform((v) => (v === '' || !v ? undefined : v)),
    toDate: z
      .string()
      .regex(ISO_DATE_REGEX, 'Must be YYYY-MM-DD')
      .optional()
      .transform((v) => (v === '' || !v ? undefined : v)),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        return data.fromDate <= data.toDate;
      }
      return true;
    },
    { message: 'fromDate must be before or equal to toDate', path: ['toDate'] },
  );

export class ReservationsQueryDto extends createZodDto(
  ReservationsQuerySchema,
) {}

export type ReservationsQuery = z.infer<typeof ReservationsQuerySchema>;
