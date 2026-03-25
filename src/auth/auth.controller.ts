import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { AuthService } from './auth.service';

@ApiTags('auth')
@ApiSecurity('api-key')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description:
      'Returns the identity and role of the caller based on the provided Bearer token. Used by the frontend for role-based access control.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: {
          id: 'user-1',
          email: 'admin@example.com',
          role: 'admin',
        },
        timestamp: '2026-03-24T12:00:00.000Z',
        path: '/auth/me',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('OK')
  getMe() {
    return this.authService.getMe();
  }
}
