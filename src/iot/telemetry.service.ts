import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AlertRulesService } from './alert-rules.service';
import { IotGateway } from './iot.gateway';
import type { TelemetryPayload } from './iot.types';

const DEFAULT_CO2_THRESHOLD = 1000;
const TELEMETRY_RETENTION_LIMIT = 500; // max rows kept per space

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertRules: AlertRulesService,
    private readonly gateway: IotGateway,
  ) {}

  async handle(
    siteId: string,
    officeId: string,
    payload: TelemetryPayload,
  ): Promise<void> {
    const space = await this.prisma.space.findUnique({
      where: { id: officeId },
      include: { place: true, deviceDesired: true },
    });

    if (!space || space.placeId !== siteId) {
      this.logger.warn(
        `Unknown device – siteId=${siteId} officeId=${officeId}. Ignoring.`,
      );
      return;
    }

    const ts = new Date(payload.ts);

    const reading = await this.prisma.telemetryAggregation.create({
      data: {
        spaceId: space.id,
        ts,
        tempC: payload.temp_c,
        humidityPct: payload.humidity_pct,
        co2Ppm: payload.co2_ppm,
        occupancy: payload.occupancy,
        powerW: payload.power_w,
      },
    });

    this.gateway.emitTelemetry(space.id, reading);
    this.logger.debug(`Telemetry saved for space ${space.id}`);

    const co2Threshold = space.deviceDesired?.co2AlertThreshold ?? DEFAULT_CO2_THRESHOLD;
    await this.alertRules.evaluate(space, payload, co2Threshold);

    // Prune old rows to avoid unbounded growth
    await this.pruneOldReadings(space.id);
  }

  async getLatest(spaceId: string, limit: number) {
    return this.prisma.telemetryAggregation.findMany({
      where: { spaceId },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }

  async getStats(spaceId: string) {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const rows = await this.prisma.telemetryAggregation.findMany({
      where: { spaceId, ts: { gte: lastHour } },
      select: { tempC: true, humidityPct: true, co2Ppm: true, occupancy: true, powerW: true },
    });

    if (rows.length === 0) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr: number[]) => Math.max(...arr);

    return {
      sampleCount: rows.length,
      avgTempC: Number(avg(rows.map((r) => r.tempC)).toFixed(2)),
      avgHumidityPct: Number(avg(rows.map((r) => r.humidityPct)).toFixed(2)),
      avgCo2Ppm: Math.round(avg(rows.map((r) => r.co2Ppm))),
      maxCo2Ppm: max(rows.map((r) => r.co2Ppm)),
      avgOccupancy: Number(avg(rows.map((r) => r.occupancy)).toFixed(2)),
      maxOccupancy: max(rows.map((r) => r.occupancy)),
      avgPowerW: Math.round(avg(rows.map((r) => r.powerW))),
    };
  }

  private async pruneOldReadings(spaceId: string): Promise<void> {
    const count = await this.prisma.telemetryAggregation.count({ where: { spaceId } });
    if (count <= TELEMETRY_RETENTION_LIMIT) return;

    const cutoff = await this.prisma.telemetryAggregation.findMany({
      where: { spaceId },
      orderBy: { ts: 'desc' },
      skip: TELEMETRY_RETENTION_LIMIT,
      take: 1,
      select: { ts: true },
    });

    if (cutoff[0]) {
      await this.prisma.telemetryAggregation.deleteMany({
        where: { spaceId, ts: { lte: cutoff[0].ts } },
      });
    }
  }
}
