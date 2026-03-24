import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiParam({ name: 'spaceId', description: 'Space ID (CUID)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of readings to return (1–500, default 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest telemetry readings and 1-hour aggregated stats',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Telemetry retrieved successfully',
        data: {
          readings: [
            {
              id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
              spaceId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
              ts: '2026-03-23T12:00:00.000Z',
              tempC: 22.5,
              humidityPct: 45.0,
              co2Ppm: 850,
              occupancy: 3,
              powerW: 1200,
            },
          ],
          stats: {
            sampleCount: 12,
            avgTempC: 22.3,
            avgHumidityPct: 44.8,
            avgCo2Ppm: 870,
            maxCo2Ppm: 1050,
            avgOccupancy: 2.5,
            maxOccupancy: 5,
            avgPowerW: 1180,
          },
        },
        timestamp: '2026-03-23T12:00:00.000Z',
        path: '/spaces/clxxxxxxxxxxxxxxxxxxxxxxxxx/telemetry',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid spaceId or query param',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
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
  @ApiParam({ name: 'spaceId', description: 'Space ID (CUID)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'all'],
    description: 'Filter by alert status: open = unresolved only, all = all alerts (default: all)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of alerts to return (1–200, default 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of alerts ordered by startedAt descending',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Alerts retrieved successfully',
        data: [
          {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            spaceId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            type: 'HIGH_CO2',
            severity: 'warning',
            value: 1250,
            threshold: 1000,
            startedAt: '2026-03-23T11:00:00.000Z',
            resolvedAt: null,
          },
        ],
        timestamp: '2026-03-23T12:00:00.000Z',
        path: '/spaces/clxxxxxxxxxxxxxxxxxxxxxxxxx/alerts',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid spaceId or query param',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Alerts retrieved successfully')
  async getAlerts(
    @Param('spaceId', ParseCuidPipe) spaceId: string,
    @Query() query: AlertsQueryDto,
  ) {
    return this.device.getAlerts(spaceId, query.status, query.limit);
  }

  @Get('device')
  @ApiOperation({ summary: 'Get digital twin state (desired + reported)' })
  @ApiParam({ name: 'spaceId', description: 'Space ID (CUID)' })
  @ApiResponse({
    status: 200,
    description: 'Desired configuration and last reported device state',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Device state retrieved successfully',
        data: {
          desired: {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            spaceId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            co2AlertThreshold: 1000,
            samplingIntervalSec: 60,
            updatedAt: '2026-03-23T10:00:00.000Z',
          },
          reported: {
            id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            spaceId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            samplingIntervalSec: 60,
            co2AlertThreshold: 1000,
            firmwareVersion: '1.2.3',
            ts: '2026-03-23T11:55:00.000Z',
          },
        },
        timestamp: '2026-03-23T12:00:00.000Z',
        path: '/spaces/clxxxxxxxxxxxxxxxxxxxxxxxxx/device',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid spaceId format',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Device state retrieved successfully')
  async getDevice(@Param('spaceId', ParseCuidPipe) spaceId: string) {
    return this.device.getDevice(spaceId);
  }

  @Patch('device/desired')
  @ApiOperation({ summary: 'Update desired device config and publish to MQTT' })
  @ApiParam({ name: 'spaceId', description: 'Space ID (CUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      description: 'At least one field must be provided',
      properties: {
        co2AlertThreshold: {
          type: 'integer',
          minimum: 400,
          maximum: 5000,
          description: 'CO₂ alert threshold in ppm (400–5000)',
          example: 1000,
        },
        samplingIntervalSec: {
          type: 'integer',
          minimum: 1,
          maximum: 3600,
          description: 'Sensor sampling interval in seconds (1–3600)',
          example: 60,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Desired config saved and published to MQTT with retain flag',
    schema: {
      allOf: [{ $ref: '#/components/schemas/SuccessResponse' }],
      example: {
        success: true,
        statusCode: 200,
        message: 'Desired config updated and published',
        data: {
          id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          spaceId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          co2AlertThreshold: 1000,
          samplingIntervalSec: 60,
          updatedAt: '2026-03-23T12:00:00.000Z',
        },
        timestamp: '2026-03-23T12:00:00.000Z',
        path: '/spaces/clxxxxxxxxxxxxxxxxxxxxxxxxx/device/desired',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or no fields provided',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
    schema: { $ref: '#/components/schemas/ErrorResponse' },
  })
  @SuccessMessage('Desired config updated and published')
  async updateDesired(
    @Param('spaceId', ParseCuidPipe) spaceId: string,
    @Body() dto: UpdateDesiredDto,
  ) {
    return this.device.updateDesired(spaceId, dto);
  }
}
