import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFacultySchema = z.object({
  name: z.string().trim().min(3, 'name debe tener entre 3 y 120 caracteres').max(120, 'name debe tener entre 3 y 120 caracteres'),
  description: z.string().trim().min(10, 'description debe tener entre 10 y 2000 caracteres').max(2000, 'description debe tener entre 10 y 2000 caracteres'),
  topics: z.array(z.string().trim().min(1).max(60)).max(20, 'máximo 20 temas').optional().default([]),
  supportTypes: z.array(z.string().trim().min(2).max(80)).max(10, 'máximo 10 tipos de apoyo').optional().default([]),
  contactEmail: z.string().trim().email('contactEmail debe ser un correo válido').max(150, 'contactEmail no debe exceder 150 caracteres').optional(),
});

export class CreateFacultyDto extends createZodDto(CreateFacultySchema) {}
