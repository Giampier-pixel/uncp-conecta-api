import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateServiceSchema = z.object({
  name: z.string().trim().min(3, 'name debe tener entre 3 y 150 caracteres').max(150, 'name debe tener entre 3 y 150 caracteres'),
  category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres'),
  description: z.string().trim().min(10, 'description debe tener entre 10 y 2000 caracteres').max(2000, 'description debe tener entre 10 y 2000 caracteres'),
  requirements: z.array(z.string().trim().min(3, 'cada requisito debe tener 3-200 caracteres').max(200, 'cada requisito debe tener 3-200 caracteres')).max(20, 'máximo 20 requisitos').optional().default([]),
  supportTypes: z.array(z.string().trim().min(2, 'cada tipo de apoyo debe tener 2-80 caracteres').max(80, 'cada tipo de apoyo debe tener 2-80 caracteres')).max(10, 'máximo 10 tipos de apoyo').optional().default([]),
  facultyAreaId: z.string().uuid('facultyAreaId debe ser un UUID'),
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}
