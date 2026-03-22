import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../../generated/prisma/client.js';

const PRISMA_ERROR_MAP: Record<
  string,
  { status: HttpStatus; message: string; error: string; errorCode: string }
> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The provided value is too long for the field',
    error: 'Bad Request',
    errorCode: 'ERR_VALUE_TOO_LONG',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'A record with these values already exists',
    error: 'Conflict',
    errorCode: 'ERR_DUPLICATE',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Invalid reference: related record does not exist',
    error: 'Bad Request',
    errorCode: 'ERR_INVALID_REFERENCE',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Record to update or delete was not found',
    error: 'Not Found',
    errorCode: 'ERR_NOT_FOUND',
  },
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { code } = exception;

    const mapped = PRISMA_ERROR_MAP[code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected database error occurred',
      error: 'Internal Server Error',
      errorCode: 'ERR_DB_ERROR',
    };

    let message = mapped.message;
    if (code === 'P2000') {
      const column = exception.meta?.column_name as string | undefined;
      const hasValidColumn =
        column && !['(not available)', '<unknown>'].includes(column);
      if (hasValidColumn) {
        message = `Value too long for field: ${column}`;
      }
    }
    if (code === 'P2002') {
      const target = (exception.meta?.target as string[] | undefined)?.[0];
      if (target) {
        message = `A record with this ${target} already exists`;
      }
    }

    return response.status(mapped.status).json({
      success: false,
      statusCode: mapped.status,
      message,
      error: mapped.error,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode: mapped.errorCode,
    });
  }
}
