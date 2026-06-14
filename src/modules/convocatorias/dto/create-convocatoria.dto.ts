import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateConvocatoriaSchema = z
  .object({
    name: z.string().trim().min(3, 'name debe tener entre 3 y 120 caracteres').max(120, 'name debe tener entre 3 y 120 caracteres'),
    opensAt: z.coerce.date({ errorMap: () => ({ message: 'opensAt debe ser una fecha válida' }) }),
    closesAt: z.coerce.date({ errorMap: () => ({ message: 'closesAt debe ser una fecha válida' }) }),
    isActive: z.boolean().optional().default(true),
  })
  .refine((d) => d.closesAt > d.opensAt, { message: 'closesAt debe ser posterior a opensAt', path: ['closesAt'] });

export class CreateConvocatoriaDto extends createZodDto(CreateConvocatoriaSchema) {}
