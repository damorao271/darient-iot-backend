import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { createZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { createZodValidationException } from './common/utils/zod-validation-exception';
import { PlacesModule } from './places/places.module';
import { SpacesModule } from './spaces/spaces.module';
import { ReservationsModule } from './reservations/reservations.module';
import { IotModule } from './iot/iot.module';

const ZodValidationPipeClass = createZodValidationPipe({
  createValidationException: createZodValidationException,
});

@Module({
  imports: [PrismaModule, PlacesModule, SpacesModule, ReservationsModule, IotModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipeClass,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
