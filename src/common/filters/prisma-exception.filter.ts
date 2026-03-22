import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../../generated/prisma/client.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { code } = exception;

    switch (code) {
      case 'P2000': {
        const column = exception.meta?.column_name as string | undefined;
        const hasValidColumn =
          column && !['(not available)', '<unknown>'].includes(column);
        const message = hasValidColumn
          ? `Value too long for field: ${column}`
          : 'The provided value is too long for the field';
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message,
          error: 'Bad Request',
        });
      }
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.[0];
        const message = target
          ? `A record with this ${target} already exists`
          : 'A record with these values already exists';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message,
          error: 'Conflict',
        });
      }
      case 'P2003':
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference: related record does not exist',
          error: 'Bad Request',
        });
      case 'P2025':
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record to update or delete was not found',
          error: 'Not Found',
        });
      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected database error occurred',
          error: 'Internal Server Error',
        });
    }
  }
}
