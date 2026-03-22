import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function zodIssuesToDetails(
  issues: unknown,
): { field: string; issue: string }[] | undefined {
  if (!Array.isArray(issues)) return undefined;
  return issues.map(
    (i: { path?: (string | number)[]; message?: string }) => ({
      field: Array.isArray(i.path) ? String(i.path.join('.')) : 'unknown',
      issue: (i as { message?: string }).message ?? 'Validation error',
    }),
  );
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const body =
      typeof rawResponse === 'object' && rawResponse !== null
        ? (rawResponse as Record<string, unknown>)
        : { message: rawResponse };

    const message =
      (typeof body.message === 'string' ? body.message : undefined) ??
      'An error occurred';
    const error =
      (typeof body.error === 'string' ? body.error : undefined) ??
      this.getDefaultError(status);
    const details =
      body.errors !== undefined
        ? zodIssuesToDetails(body.errors)
        : (body.details as { field: string; issue: string }[] | undefined);
    const errorCode =
      typeof body.errorCode === 'string' ? body.errorCode : undefined;

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${JSON.stringify(body)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      ...(details && details.length > 0 ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errorCode ? { errorCode } : {}),
    });
  }

  private getDefaultError(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
    };
    return map[status] ?? 'Internal Server Error';
  }
}
