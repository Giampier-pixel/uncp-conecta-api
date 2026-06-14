import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'email es requerido' })
    .email('email debe ser un correo válido')
    .max(150, 'email no debe exceder 150 caracteres'),
  password: z
    .string({ required_error: 'password es requerido' })
    .min(6, 'password debe tener entre 6 y 72 caracteres')
    .max(72, 'password debe tener entre 6 y 72 caracteres'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
