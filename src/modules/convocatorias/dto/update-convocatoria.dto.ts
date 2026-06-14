import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateConvocatoriaSchema = z
  .object({
    name: z.string().trim().min(3, 'name debe tener entre 3 y 120 caracteres').max(120, 'name debe tener entre 3 y 120 caracteres').optional(),
    opensAt: z.coerce.date({ errorMap: () => ({ message: 'opensAt debe ser una fecha válida' }) }).optional(),
    closesAt: z.coerce.date({ errorMap: () => ({ message: 'closesAt debe ser una fecha válida' }) }).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Debes enviar al menos un campo para actualizar' })
  .refine((d) => !(d.opensAt && d.closesAt) || d.closesAt > d.opensAt, { message: 'closesAt debe ser posterior a opensAt', path: ['closesAt'] });

export class UpdateConvocatoriaDto extends createZodDto(UpdateConvocatoriaSchema) {}
