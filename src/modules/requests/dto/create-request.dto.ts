import { createZodDto } from 'nestjs-zod';
import { ApplicantType, RequestChannel } from '@prisma/client';
import { z } from 'zod';

const aiClassificationSchema = z.object({
  category: z.string().trim().min(2, 'aiClassification.category debe tener 2-80 caracteres').max(80, 'aiClassification.category debe tener 2-80 caracteres'),
  supportType: z.string().trim().min(2, 'aiClassification.supportType debe tener 2-80 caracteres').max(80, 'aiClassification.supportType debe tener 2-80 caracteres'),
  suggestedArea: z.string().trim().min(2, 'aiClassification.suggestedArea debe tener 2-120 caracteres').max(120, 'aiClassification.suggestedArea debe tener 2-120 caracteres'),
  suggestedAreaId: z.string().uuid('aiClassification.suggestedAreaId debe ser un UUID').optional(),
  confidence: z.number({ required_error: 'aiClassification.confidence es requerido' }).min(0, 'confidence debe estar entre 0 y 1').max(1, 'confidence debe estar entre 0 y 1'),
  missingFields: z.array(z.string()),
  reasoningSummary: z.string().trim().min(10, 'reasoningSummary debe tener 10-2000 caracteres').max(2000, 'reasoningSummary debe tener 10-2000 caracteres'),
});

export const CreateRequestSchema = z
  .object({
    representativeName: z.string().trim().min(3, 'representativeName debe tener entre 3 y 120 caracteres').max(120, 'representativeName debe tener entre 3 y 120 caracteres'),
    representativeDni: z.string().trim().regex(/^\d{8}$/, 'representativeDni debe tener exactamente 8 dígitos'),
    contactPhone: z.string().trim().regex(/^\d{6,15}$/, 'contactPhone debe tener entre 6 y 15 dígitos'),
    contactEmail: z.string().trim().email('contactEmail debe ser un correo válido').max(150, 'contactEmail no debe exceder 150 caracteres').optional(),
    applicantType: z.nativeEnum(ApplicantType, { errorMap: () => ({ message: 'applicantType inválido' }) }),
    channel: z.nativeEnum(RequestChannel, { errorMap: () => ({ message: 'channel inválido (app_movil | web)' }) }),
    communityName: z.string().trim().min(3, 'communityName debe tener entre 3 y 150 caracteres').max(150, 'communityName debe tener entre 3 y 150 caracteres').optional(),
    location: z.string().trim().min(3, 'location debe tener entre 3 y 150 caracteres').max(150, 'location debe tener entre 3 y 150 caracteres'),
    district: z.string().trim().min(2, 'district debe tener entre 2 y 100 caracteres').max(100, 'district debe tener entre 2 y 100 caracteres'),
    rawDescription: z.string().trim().min(10, 'rawDescription debe tener entre 10 y 5000 caracteres').max(5000, 'rawDescription debe tener entre 10 y 5000 caracteres'),
    formalTitle: z.string().trim().max(200, 'formalTitle no debe exceder 200 caracteres').optional(),
    formalDescription: z.string().trim().min(10, 'formalDescription debe tener entre 10 y 10000 caracteres').max(10000, 'formalDescription debe tener entre 10 y 10000 caracteres'),
    category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres'),
    supportType: z.string().trim().min(2, 'supportType debe tener entre 2 y 80 caracteres').max(80, 'supportType debe tener entre 2 y 80 caracteres'),
    suggestedAreaId: z.string().uuid('suggestedAreaId debe ser un UUID').optional(),
    beneficiariesCount: z.number().int('beneficiariesCount debe ser un entero').positive('beneficiariesCount debe ser mayor que 0').optional(),
    entityName: z.string().trim().min(3, 'entityName debe tener entre 3 y 150 caracteres').max(150, 'entityName debe tener entre 3 y 150 caracteres').optional(),
    officialPosition: z.string().trim().min(3, 'officialPosition debe tener entre 3 y 100 caracteres').max(100, 'officialPosition debe tener entre 3 y 100 caracteres').optional(),
    attachedDocumentName: z.string().trim().max(200, 'attachedDocumentName no debe exceder 200 caracteres').optional(),
    signatureImage: z.string().regex(/^data:image\//, 'signatureImage debe ser una imagen (data URL)').max(1_500_000, 'La firma es demasiado grande').optional(),
    aiClassification: aiClassificationSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.applicantType === ApplicantType.gobierno_local) {
      if (!data.entityName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'entityName es requerido para gobierno_local', path: ['entityName'] });
      }
      if (!data.officialPosition) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'officialPosition es requerido para gobierno_local', path: ['officialPosition'] });
      }
    }
  });

export class CreateRequestDto extends createZodDto(CreateRequestSchema) {}
