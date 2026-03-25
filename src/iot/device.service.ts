import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { IotGateway } from './iot.gateway';
import type { ReportedPayload } from './iot.types';
import { MqttService } from './mqtt.service';
import type { UpdateDesiredDto } from './dto/update-desired.dto';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqtt: MqttService,
    private readonly gateway: IotGateway,
  ) {}

  async handleReported(
    siteId: string,
    officeId: string,
    payload: ReportedPayload,
  ): Promise<void> {
    const space = await this.prisma.space.findUnique({
      where: { id: officeId },
      select: { id: true, placeId: true },
    });

    if (!space || space.placeId !== siteId) {
      this.logger.warn(`Unknown device reported – siteId=${siteId} officeId=${officeId}`);
      return;
    }

    const reported = await this.prisma.deviceReported.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        samplingIntervalSec: payload.samplingIntervalSec,
        co2AlertThreshold: payload.co2_alert_threshold,
        firmwareVersion: payload.firmwareVersion,
        ts: new Date(payload.ts),
      },
      update: {
        samplingIntervalSec: payload.samplingIntervalSec,
        co2AlertThreshold: payload.co2_alert_threshold,
        firmwareVersion: payload.firmwareVersion,
        ts: new Date(payload.ts),
      },
    });

    this.gateway.emitReported(space.id, reported);
    this.logger.debug(`Reported state updated for space ${space.id}`);
  }

  async getDevice(spaceId: string) {
    await this.requireSpace(spaceId);

    const [desired, reported] = await Promise.all([
      this.prisma.deviceDesired.findUnique({ where: { spaceId } }),
      this.prisma.deviceReported.findUnique({ where: { spaceId } }),
    ]);

    return { desired, reported };
  }

  async updateDesired(spaceId: string, dto: UpdateDesiredDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { place: true, deviceDesired: true },
    });

    if (!space) {
      throw new NotFoundException({ message: 'Space not found', errorCode: 'ERR_SPACE_NOT_FOUND' });
    }

    const current = space.deviceDesired ?? { co2AlertThreshold: 1000, samplingIntervalSec: 10 };

    const desired = await this.prisma.deviceDesired.upsert({
      where: { spaceId },
      create: {
        spaceId,
        co2AlertThreshold: dto.co2AlertThreshold ?? current.co2AlertThreshold,
        samplingIntervalSec: dto.samplingIntervalSec ?? current.samplingIntervalSec,
      },
      update: {
        ...(dto.co2AlertThreshold !== undefined && { co2AlertThreshold: dto.co2AlertThreshold }),
        ...(dto.samplingIntervalSec !== undefined && {
          samplingIntervalSec: dto.samplingIntervalSec,
        }),
      },
    });

    // Publish to MQTT with retain so the device gets it even if currently offline
    const topic = this.mqtt.buildDesiredTopic(space.placeId, spaceId);
    this.mqtt.publish(
      topic,
      {
        samplingIntervalSec: desired.samplingIntervalSec,
        co2_alert_threshold: desired.co2AlertThreshold,
      },
      true,
    );

    this.logger.log(`Desired config published to ${topic}`);
    return desired;
  }

  async getAlerts(spaceId: string, status: 'open' | 'all', limit: number) {
    await this.requireSpace(spaceId);
    return this.prisma.alert.findMany({
      where: {
        spaceId,
        ...(status === 'open' ? { resolvedAt: null } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  private async requireSpace(spaceId: string): Promise<void> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { id: true },
    });
    if (!space) {
      throw new NotFoundException({ message: 'Space not found', errorCode: 'ERR_SPACE_NOT_FOUND' });
    }
  }
}
