import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  SUCCESS_MESSAGE_KEY,
  SUCCESS_STATUS_KEY,
} from '../interceptors/response-transform.interceptor';

export const SuccessMessage = (message: string, statusCode?: number) =>
  applyDecorators(
    SetMetadata(SUCCESS_MESSAGE_KEY, message),
    ...(statusCode !== undefined ? [SetMetadata(SUCCESS_STATUS_KEY, statusCode)] : []),
  );
