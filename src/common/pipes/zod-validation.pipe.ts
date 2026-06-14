import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) =>
    new BadRequestException({
      statusCode: 400,
      message: error.issues.map((issue) => issue.message),
      error: 'Bad Request',
    }),
});
