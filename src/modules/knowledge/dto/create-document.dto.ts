import { createZodDto } from 'nestjs-zod';
import { KnowledgeSourceType } from '@prisma/client';
import { z } from 'zod';

export const CreateDocumentSchema = z.object({
  title: z.string().trim().min(3, 'title debe tener entre 3 y 200 caracteres').max(200, 'title debe tener entre 3 y 200 caracteres'),
  sourceType: z.nativeEnum(KnowledgeSourceType, { errorMap: () => ({ message: 'sourceType inválido (insumo_desafio | publica | simulada | referencial)' }) }),
  content: z.string().trim().min(50, 'content debe tener entre 50 y 100000 caracteres').max(100_000, 'content debe tener entre 50 y 100000 caracteres'),
  tags: z
    .array(z.string().trim().min(2, 'cada tag debe tener entre 2 y 50 caracteres').max(50, 'cada tag debe tener entre 2 y 50 caracteres'))
    .max(15, 'máximo 15 tags')
    .optional()
    .default([]),
});

export class CreateDocumentDto extends createZodDto(CreateDocumentSchema) {}
