import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SuccessMessage } from './common/decorators/success-message.decorator';
import { AppService } from './app.service';

@ApiSecurity('api-key')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'API health check',
    schema: { $ref: '#/components/schemas/SuccessResponse' },
  })
  @SuccessMessage('API is running')
  getHello(): string {
    return this.appService.getHello();
  }
}
