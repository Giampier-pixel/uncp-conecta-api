import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListServicesQuerySchema = z.object({
  category: z
    .string()
    .min(2, 'category debe tener entre 2 y 80 caracteres')
    .max(80, 'category debe tener entre 2 y 80 caracteres')
    .optional(),
});

export class ListServicesQueryDto extends createZodDto(ListServicesQuerySchema) {}
