import { BadRequestException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';

export function createZodValidationException(
  error: unknown,
): BadRequestException {
  const issues =
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
      ? (error as { issues: unknown[] }).issues
      : [];

  return new BadRequestException({
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
    error: 'Bad Request',
    errors: issues,
    errorCode: 'ERR_VALIDATION',
  });
}
