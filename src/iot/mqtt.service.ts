import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import type {
  ReportedHandler,
  ReportedPayload,
  TelemetryHandler,
  TelemetryPayload,
} from './iot.types';

const TELEMETRY_TOPIC = 'sites/+/offices/+/telemetry';
const REPORTED_TOPIC = 'sites/+/offices/+/reported';

// sites/{siteId}/offices/{officeId}/{suffix}
const TOPIC_RE = /^sites\/([^/]+)\/offices\/([^/]+)\/(\w+)$/;

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;

  private telemetryHandler: TelemetryHandler | null = null;
  private reportedHandler: ReportedHandler | null = null;

  onModuleInit() {
    const url = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
    this.logger.log(`Connecting to MQTT broker: ${url}`);

    this.client = mqtt.connect(url, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to MQTT broker');
      this.client!.subscribe([TELEMETRY_TOPIC, REPORTED_TOPIC], (err) => {
        if (err) this.logger.error('MQTT subscribe error', err);
        else this.logger.log('Subscribed to telemetry and reported topics');
      });
    });

    this.client.on('message', (topic, buffer) => {
      void this.handleMessage(topic, buffer);
    });

    this.client.on('error', (err) => this.logger.error('MQTT error', err.message));
    this.client.on('reconnect', () => this.logger.warn('MQTT reconnecting…'));
    this.client.on('offline', () => this.logger.warn('MQTT client offline'));
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }
  }

  setTelemetryHandler(handler: TelemetryHandler) {
    this.telemetryHandler = handler;
  }

  setReportedHandler(handler: ReportedHandler) {
    this.reportedHandler = handler;
  }

  publish(topic: string, payload: object, retain = false): void {
    if (!this.client?.connected) {
      this.logger.warn(`MQTT not connected – cannot publish to ${topic}`);
      return;
    }
    this.client.publish(topic, JSON.stringify(payload), { qos: 1, retain });
  }

  buildDesiredTopic(siteId: string, officeId: string): string {
    return `sites/${siteId}/offices/${officeId}/desired`;
  }

  private async handleMessage(topic: string, buffer: Buffer) {
    const match = TOPIC_RE.exec(topic);
    if (!match) return;

    const [, siteId, officeId, suffix] = match;
    let payload: unknown;

    try {
      payload = JSON.parse(buffer.toString()) as unknown;
    } catch {
      this.logger.warn(`Bad JSON on topic ${topic}`);
      return;
    }

    if (suffix === 'telemetry' && this.telemetryHandler) {
      await this.telemetryHandler(siteId, officeId, payload as TelemetryPayload);
    } else if (suffix === 'reported' && this.reportedHandler) {
      await this.reportedHandler(siteId, officeId, payload as ReportedPayload);
    }
  }
}
