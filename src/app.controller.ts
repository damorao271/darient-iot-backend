import { Controller, Get } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SuccessMessage } from './common/decorators/success-message.decorator';
import { AppService } from './app.service';

@ApiSecurity('api-key')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SuccessMessage('API is running')
  getHello(): string {
    return this.appService.getHello();
  }
}
