import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReplyRequestSchema = z.object({
  requestId: z.string().uuid('requestId debe ser un UUID'),
  dni: z.string().trim().regex(/^\d{8}$/, 'dni debe tener exactamente 8 dígitos'),
  message: z.string().trim().min(5, 'message debe tener entre 5 y 3000 caracteres').max(3000, 'message debe tener entre 5 y 3000 caracteres'),
});

export class ReplyRequestDto extends createZodDto(ReplyRequestSchema) {}
