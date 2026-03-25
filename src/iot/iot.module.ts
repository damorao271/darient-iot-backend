import { Module, OnModuleInit } from '@nestjs/common';
import { AlertRulesService } from './alert-rules.service';
import { DeviceService } from './device.service';
import { IotController } from './iot.controller';
import { IotGateway } from './iot.gateway';
import { MqttService } from './mqtt.service';
import { TelemetryService } from './telemetry.service';

@Module({
  controllers: [IotController],
  providers: [
    MqttService,
    IotGateway,
    AlertRulesService,
    TelemetryService,
    DeviceService,
  ],
  exports: [DeviceService, TelemetryService],
})
export class IotModule implements OnModuleInit {
  constructor(
    private readonly mqtt: MqttService,
    private readonly telemetry: TelemetryService,
    private readonly device: DeviceService,
  ) {}

  onModuleInit() {
    this.mqtt.setTelemetryHandler((siteId, officeId, payload) =>
      this.telemetry.handle(siteId, officeId, payload),
    );
    this.mqtt.setReportedHandler((siteId, officeId, payload) =>
      this.device.handleReported(siteId, officeId, payload),
    );
  }
}
