import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExportQuerySchema = z.object({
  format: z.enum(['html', 'csv', 'json'], { errorMap: () => ({ message: 'format debe ser html, csv o json' }) }),
});

export class ExportQueryDto extends createZodDto(ExportQuerySchema) {}
