import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

const cuidSchema = z.string().cuid();

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const result = cuidSchema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid ID format',
        error: 'Bad Request',
        errorCode: 'ERR_INVALID_ID',
      });
    }
    return result.data;
  }
}
