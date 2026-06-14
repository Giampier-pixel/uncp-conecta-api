import { createZodDto } from 'nestjs-zod';
import { ApplicantType } from '@prisma/client';
import { z } from 'zod';

export const GenerateDraftSchema = z.object({
  rawDescription: z.string().trim().min(10, 'rawDescription debe tener entre 10 y 5000 caracteres').max(5000, 'rawDescription debe tener entre 10 y 5000 caracteres'),
  applicantType: z.nativeEnum(ApplicantType, { errorMap: () => ({ message: 'applicantType inválido' }) }),
  communityName: z.string().trim().min(3, 'communityName debe tener entre 3 y 150 caracteres').max(150, 'communityName debe tener entre 3 y 150 caracteres'),
  location: z.string().trim().max(150, 'location no debe exceder 150 caracteres').optional(),
  district: z.string().trim().max(100, 'district no debe exceder 100 caracteres').optional(),
  beneficiariesCount: z.number().int('beneficiariesCount debe ser un entero').positive('beneficiariesCount debe ser mayor que 0').optional(),
  category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres'),
  supportType: z.string().trim().min(2, 'supportType debe tener entre 2 y 80 caracteres').max(80, 'supportType debe tener entre 2 y 80 caracteres'),
  representativeName: z.string().trim().max(120, 'representativeName no debe exceder 120 caracteres').optional(),
  entityName: z.string().trim().max(150, 'entityName no debe exceder 150 caracteres').optional(),
  officialPosition: z.string().trim().max(100, 'officialPosition no debe exceder 100 caracteres').optional(),
});

export class GenerateDraftDto extends createZodDto(GenerateDraftSchema) {}
