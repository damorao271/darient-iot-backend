import { Injectable, Logger } from '@nestjs/common';
import { toZonedTime } from 'date-fns-tz';
import type { Alert, Place, Space } from '../../generated/prisma/client.js';
import { AlertKind, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../common/prisma/prisma.service';
import { parseTimeToMinutes } from '../common/utils/time.utils';
import { IotGateway } from './iot.gateway';
import type { TelemetryPayload } from './iot.types';

// ─── Time window constants (all in milliseconds) ─────────────────────────────
const CO2_OPEN_AFTER_MS = 0.3 * 60 * 1000;
const CO2_CLOSE_AFTER_MS = 0.3 * 60 * 1000;

const OCC_MAX_OPEN_AFTER_MS = 0.3 * 60 * 1000;
const OCC_MAX_CLOSE_AFTER_MS = 0.3 * 60 * 1000;

const OCC_UNEXP_OPEN_AFTER_MS = 0.3 * 60 * 1000;
const OCC_UNEXP_CLOSE_AFTER_MS = 0.3 * 60 * 1000;

interface AlertWindow {
  conditionTrueFrom: Date | null;
  conditionFalseFrom: Date | null;
  openAlertId: string | null;
}

type SpaceWithPlace = Space & { place: Place };

@Injectable()
export class AlertRulesService {
  private readonly logger = new Logger(AlertRulesService.name);
  private readonly windows = new Map<string, AlertWindow>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: IotGateway,
  ) {}

  async evaluate(
    space: SpaceWithPlace,
    payload: TelemetryPayload,
    co2Threshold: number,
  ): Promise<void> {
    const now = new Date();

    await Promise.all([
      this.evaluateRule(
        space,
        AlertKind.CO2,
        payload.co2_ppm > co2Threshold,
        { co2_ppm: payload.co2_ppm, threshold: co2Threshold },
        CO2_OPEN_AFTER_MS,
        CO2_CLOSE_AFTER_MS,
        now,
      ),
      this.evaluateRule(
        space,
        AlertKind.OCCUPANCY_MAX,
        payload.occupancy > space.capacity,
        { occupancy: payload.occupancy, capacity: space.capacity },
        OCC_MAX_OPEN_AFTER_MS,
        OCC_MAX_CLOSE_AFTER_MS,
        now,
      ),
      this.evaluateUnexpected(space, payload, now),
    ]);
  }

  private async evaluateUnexpected(
    space: SpaceWithPlace,
    payload: TelemetryPayload,
    now: Date,
  ): Promise<void> {
    if (payload.occupancy === 0) {
      await this.evaluateRule(
        space,
        AlertKind.OCCUPANCY_UNEXPECTED,
        false,
        {},
        OCC_UNEXP_OPEN_AFTER_MS,
        OCC_UNEXP_CLOSE_AFTER_MS,
        now,
      );
      return;
    }

    // Determine if occupancy is unexpected
    let reason: string | null = null;

    if (space.openTime && space.closeTime) {
      const isOutside = this.isOutsideOfficeHours(
        now,
        space.openTime,
        space.closeTime,
        space.place.timezone,
      );
      if (isOutside) reason = 'out_of_hours';
    }

    if (!reason) {
      const activeReservations = await this.prisma.reservation.count({
        where: { spaceId: space.id, startAt: { lte: now }, endAt: { gt: now } },
      });
      if (activeReservations === 0) reason = 'no_reservation';
    }

    await this.evaluateRule(
      space,
      AlertKind.OCCUPANCY_UNEXPECTED,
      reason !== null,
      reason ? { occupancy: payload.occupancy, reason } : {},
      OCC_UNEXP_OPEN_AFTER_MS,
      OCC_UNEXP_CLOSE_AFTER_MS,
      now,
    );
  }

  private async evaluateRule(
    space: SpaceWithPlace,
    kind: AlertKind,
    conditionMet: boolean,
    meta: Record<string, unknown>,
    openAfterMs: number,
    closeAfterMs: number,
    now: Date,
  ): Promise<void> {
    const key = `${space.id}:${kind}`;
    const window: AlertWindow = this.windows.get(key) ?? {
      conditionTrueFrom: null,
      conditionFalseFrom: null,
      openAlertId: null,
    };

    if (conditionMet) {
      window.conditionFalseFrom = null;
      if (!window.conditionTrueFrom) window.conditionTrueFrom = now;

      const elapsed = now.getTime() - window.conditionTrueFrom.getTime();
      if (!window.openAlertId && elapsed >= openAfterMs) {
        const alert = await this.openAlert(
          space.id,
          kind,
          window.conditionTrueFrom,
          meta,
        );
        window.openAlertId = alert.id;
        this.gateway.emitAlertOpened(space.id, alert);
        this.logger.warn(`Alert opened: ${kind} for space ${space.id}`);
      }
    } else {
      window.conditionTrueFrom = null;

      if (window.openAlertId) {
        if (!window.conditionFalseFrom) window.conditionFalseFrom = now;

        const elapsed = now.getTime() - window.conditionFalseFrom.getTime();
        if (elapsed >= closeAfterMs) {
          const alert = await this.resolveAlert(window.openAlertId, now);
          this.gateway.emitAlertResolved(space.id, alert);
          this.logger.log(`Alert resolved: ${kind} for space ${space.id}`);
          window.openAlertId = null;
          window.conditionFalseFrom = null;
        }
      } else {
        window.conditionFalseFrom = null;
      }
    }

    this.windows.set(key, window);
  }

  private async openAlert(
    spaceId: string,
    kind: AlertKind,
    startedAt: Date,
    meta: Record<string, unknown>,
  ): Promise<Alert> {
    return this.prisma.alert.create({
      data: {
        spaceId,
        kind,
        startedAt,
        metaJson: meta as Prisma.InputJsonValue,
      },
    });
  }

  private async resolveAlert(
    alertId: string,
    resolvedAt: Date,
  ): Promise<Alert> {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { resolvedAt },
    });
  }

  private isOutsideOfficeHours(
    now: Date,
    openTime: string,
    closeTime: string,
    timezone: string,
  ): boolean {
    const zonedNow = toZonedTime(now, timezone);
    const currentMinutes = zonedNow.getHours() * 60 + zonedNow.getMinutes();
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);
    return currentMinutes < openMinutes || currentMinutes >= closeMinutes;
  }
}
