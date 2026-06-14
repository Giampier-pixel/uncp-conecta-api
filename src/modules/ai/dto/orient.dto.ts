import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant'], { errorMap: () => ({ message: 'role debe ser user o assistant' }) }),
  content: z.string().trim().max(2000, 'content del historial no debe exceder 2000 caracteres'),
});

export const OrientSchema = z.object({
  message: z.string().trim().min(5, 'message debe tener entre 5 y 2000 caracteres').max(2000, 'message debe tener entre 5 y 2000 caracteres'),
  location: z.string().trim().max(150, 'location no debe exceder 150 caracteres').optional(),
  history: z.array(historyItemSchema).max(10, 'history admite máximo 10 ítems').optional(),
});

export class OrientDto extends createZodDto(OrientSchema) {}
