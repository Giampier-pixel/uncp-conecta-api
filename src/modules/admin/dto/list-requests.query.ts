import { createZodDto } from 'nestjs-zod';
import { ApplicantType, RequestStatus } from '@prisma/client';
import { z } from 'zod';

export const ListRequestsQuerySchema = z.object({
  status: z.nativeEnum(RequestStatus, { errorMap: () => ({ message: 'status inválido' }) }).optional(),
  category: z.string().trim().min(2, 'category debe tener entre 2 y 80 caracteres').max(80, 'category debe tener entre 2 y 80 caracteres').optional(),
  applicantType: z.nativeEnum(ApplicantType, { errorMap: () => ({ message: 'applicantType inválido' }) }).optional(),
  district: z.string().trim().min(2, 'district debe tener entre 2 y 100 caracteres').max(100, 'district debe tener entre 2 y 100 caracteres').optional(),
  page: z.coerce.number({ invalid_type_error: 'page debe ser un número' }).int('page debe ser entero').min(1, 'page debe ser ≥ 1').default(1),
  limit: z.coerce.number({ invalid_type_error: 'limit debe ser un número' }).int('limit debe ser entero').min(1, 'limit debe estar entre 1 y 50').max(50, 'limit debe estar entre 1 y 50').default(10),
});

export class ListRequestsQueryDto extends createZodDto(ListRequestsQuerySchema) {}
