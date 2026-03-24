export interface TelemetryPayload {
  ts: string;
  temp_c: number;
  humidity_pct: number;
  co2_ppm: number;
  occupancy: number;
  power_w: number;
}

export interface ReportedPayload {
  ts: string;
  samplingIntervalSec: number;
  co2_alert_threshold: number;
  firmwareVersion: string;
}

export interface DesiredPayload {
  samplingIntervalSec?: number;
  co2_alert_threshold?: number;
}

export type TelemetryHandler = (
  siteId: string,
  officeId: string,
  payload: TelemetryPayload,
) => Promise<void>;

export type ReportedHandler = (
  siteId: string,
  officeId: string,
  payload: ReportedPayload,
) => Promise<void>;
