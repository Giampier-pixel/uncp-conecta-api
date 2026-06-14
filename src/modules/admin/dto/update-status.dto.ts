import { createZodDto } from 'nestjs-zod';
import { RequestStatus } from '@prisma/client';
import { z } from 'zod';

export const UpdateStatusSchema = z
  .object({
    status: z.nativeEnum(RequestStatus, { errorMap: () => ({ message: 'status destino inválido' }) }),
    areaId: z.string().uuid('areaId debe ser un UUID').optional(),
    comment: z.string().trim().min(5, 'comment debe tener entre 5 y 2000 caracteres').max(2000, 'comment debe tener entre 5 y 2000 caracteres').optional(),
    nextStep: z.string().trim().max(250, 'nextStep no debe exceder 250 caracteres').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === RequestStatus.DERIVADA_A_FACULTAD && !data.areaId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'areaId es requerido para DERIVADA_A_FACULTAD', path: ['areaId'] });
    }
    if (data.status === RequestStatus.INFORMACION_PENDIENTE && !data.comment) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'comment es requerido para INFORMACION_PENDIENTE (qué falta)', path: ['comment'] });
    }
    if (data.status === RequestStatus.NO_PROCEDE && !data.comment) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'comment es requerido para NO_PROCEDE (motivo claro)', path: ['comment'] });
    }
  });

export class UpdateStatusDto extends createZodDto(UpdateStatusSchema) {}
