import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TrackingQuerySchema = z.object({
  dni: z
    .string({
      required_error: 'dni debe tener exactamente 8 dígitos',
      invalid_type_error: 'dni debe tener exactamente 8 dígitos',
    })
    .trim()
    .regex(/^\d{8}$/, 'dni debe tener exactamente 8 dígitos'),
});

export class TrackingQueryDto extends createZodDto(TrackingQuerySchema) {}
