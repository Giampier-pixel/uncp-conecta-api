import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateServiceSchema = z
  .object({
    name: z.string().trim().min(3, 'name debe tener entre 3 y 150 caracteres').max(150, 'name debe tener entre 3 y 150 caracteres').optional(),
    category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres').optional(),
    description: z.string().trim().min(10, 'description debe tener entre 10 y 2000 caracteres').max(2000, 'description debe tener entre 10 y 2000 caracteres').optional(),
    requirements: z.array(z.string().trim().min(3).max(200)).max(20, 'máximo 20 requisitos').optional(),
    supportTypes: z.array(z.string().trim().min(2).max(80)).max(10, 'máximo 10 tipos de apoyo').optional(),
    facultyAreaId: z.string().uuid('facultyAreaId debe ser un UUID').optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debes enviar al menos un campo para actualizar' });

export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {}
