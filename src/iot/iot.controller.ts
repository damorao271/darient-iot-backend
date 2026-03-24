import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { AlertsQueryDto } from './dto/alerts-query.dto';
import { TelemetryQueryDto } from './dto/telemetry-query.dto';
import { UpdateDesiredDto } from './dto/update-desired.dto';
import { DeviceService } from './device.service';
import { TelemetryService } from './telemetry.service';

@ApiTags('IoT')
@ApiSecurity('api-key')
@Controller('spaces/:spaceId')
export class IotController {
  constructor(
    private readonly telemetry: TelemetryService,
    private readonly device: DeviceService,
  ) {}

  @Get('telemetry')
  @ApiOperation({ summary: 'Get latest telemetry readings for a space' })
  @SuccessMessage('Telemetry retrieved successfully')
  async getTelemetry(
    @Param('spaceId', ParseCuidPipe) spaceId: string,
    @Query() query: TelemetryQueryDto,
  ) {
    const [readings, stats] = await Promise.all([
      this.telemetry.getLatest(spaceId, query.limit),
      this.telemetry.getStats(spaceId),
    ]);
    return { readings, stats };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts for a space (active or all)' })
  @SuccessMessage('Alerts retrieved successfully')
  async getAlerts(
    @Param('spaceId', ParseCuidPipe) spaceId: string,
    @Query() query: AlertsQueryDto,
  ) {
    return this.device.getAlerts(spaceId, query.status, query.limit);
  }

  @Get('device')
  @ApiOperation({ summary: 'Get digital twin state (desired + reported)' })
  @SuccessMessage('Device state retrieved successfully')
  async getDevice(@Param('spaceId', ParseCuidPipe) spaceId: string) {
    return this.device.getDevice(spaceId);
  }

  @Patch('device/desired')
  @ApiOperation({ summary: 'Update desired device config and publish to MQTT' })
  @SuccessMessage('Desired config updated and published')
  async updateDesired(
    @Param('spaceId', ParseCuidPipe) spaceId: string,
    @Body() dto: UpdateDesiredDto,
  ) {
    return this.device.updateDesired(spaceId, dto);
  }
}
