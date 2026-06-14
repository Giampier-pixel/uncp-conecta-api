import { createZodDto } from 'nestjs-zod';
import { ApplicantType } from '@prisma/client';
import { z } from 'zod';

export const PreviewSchema = z.object({
  applicantType: z.nativeEnum(ApplicantType, { errorMap: () => ({ message: 'applicantType inválido' }) }),
  representativeName: z.string().trim().min(3, 'representativeName debe tener entre 3 y 120 caracteres').max(120, 'representativeName debe tener entre 3 y 120 caracteres'),
  representativeDni: z.string().trim().regex(/^\d{8}$/, 'representativeDni debe tener exactamente 8 dígitos').optional(),
  contactPhone: z.string().trim().regex(/^\d{6,15}$/, 'contactPhone debe tener entre 6 y 15 dígitos').optional(),
  contactEmail: z.string().trim().email('contactEmail debe ser un correo válido').max(150).optional(),
  communityName: z.string().trim().min(3, 'communityName debe tener entre 3 y 150 caracteres').max(150, 'communityName debe tener entre 3 y 150 caracteres'),
  location: z.string().trim().max(150, 'location no debe exceder 150 caracteres').optional(),
  district: z.string().trim().max(100, 'district no debe exceder 100 caracteres').optional(),
  category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres'),
  supportType: z.string().trim().min(2, 'supportType debe tener entre 2 y 80 caracteres').max(80, 'supportType debe tener entre 2 y 80 caracteres'),
  suggestedAreaName: z.string().trim().max(120, 'suggestedAreaName no debe exceder 120 caracteres').optional(),
  beneficiariesCount: z.number().int('beneficiariesCount debe ser un entero').positive('beneficiariesCount debe ser mayor que 0').optional(),
  formalTitle: z.string().trim().min(3, 'formalTitle debe tener entre 3 y 200 caracteres').max(200, 'formalTitle debe tener entre 3 y 200 caracteres'),
  formalDescription: z.string().trim().min(10, 'formalDescription debe tener entre 10 y 10000 caracteres').max(10000, 'formalDescription debe tener entre 10 y 10000 caracteres'),
  entityName: z.string().trim().max(150, 'entityName no debe exceder 150 caracteres').optional(),
  officialPosition: z.string().trim().max(100, 'officialPosition no debe exceder 100 caracteres').optional(),
  attachedDocumentName: z.string().trim().max(200, 'attachedDocumentName no debe exceder 200 caracteres').optional(),
  codigo: z.string().trim().max(20, 'codigo no debe exceder 20 caracteres').optional(),
  signatureImage: z.string().regex(/^data:image\//, 'signatureImage debe ser una imagen (data URL)').max(1_500_000, 'La firma es demasiado grande').optional(),
});

export class PreviewDto extends createZodDto(PreviewSchema) {}
