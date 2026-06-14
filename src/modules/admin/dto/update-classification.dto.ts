import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateClassificationSchema = z
  .object({
    category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres').optional(),
    supportType: z.string().trim().min(2, 'supportType debe tener entre 2 y 80 caracteres').max(80, 'supportType debe tener entre 2 y 80 caracteres').optional(),
    suggestedAreaId: z.string().uuid('suggestedAreaId debe ser un UUID').optional(),
  })
  .refine(
    (data) => data.category !== undefined || data.supportType !== undefined || data.suggestedAreaId !== undefined,
    { message: 'Debes enviar al menos un campo para corregir' },
  );

export class UpdateClassificationDto extends createZodDto(UpdateClassificationSchema) {}
