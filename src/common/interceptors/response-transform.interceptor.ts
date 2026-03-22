import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export const SUCCESS_MESSAGE_KEY = 'success_message';
export const SUCCESS_STATUS_KEY = 'success_status';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        const statusCode =
          this.reflector.get<number>(
            SUCCESS_STATUS_KEY,
            context.getHandler(),
          ) ??
          response.statusCode ??
          200;

        const message =
          this.reflector.get<string>(
            SUCCESS_MESSAGE_KEY,
            context.getHandler(),
          ) ?? this.getDefaultMessage(request.method);

        return {
          success: true,
          statusCode,
          message,
          data: data ?? null,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private getDefaultMessage(method: string): string {
    const defaults: Record<string, string> = {
      GET: 'Resource retrieved successfully',
      POST: 'Resource created successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    return defaults[method] ?? 'Request completed successfully';
  }
}
