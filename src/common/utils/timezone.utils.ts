import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Get week bounds (Monday 00:00 to Sunday 23:59:59.999) in the given timezone
 * that contain the UTC date. Returns UTC timestamps for querying.
 */
export function getWeekBoundsUtc(
  utcDate: Date,
  timeZone: string,
): { start: Date; end: Date } {
  const zoned = toZonedTime(utcDate, timeZone);
  const y = zoned.getFullYear();
  const m = zoned.getMonth();
  const d = zoned.getDate();
  const day = zoned.getDay();
  const daysFromMonday = (day + 6) % 7;

  const mondayLocal = new Date(y, m, d - daysFromMonday, 0, 0, 0, 0);
  const sundayLocal = new Date(y, m, d - daysFromMonday + 6, 23, 59, 59, 999);

  return {
    start: fromZonedTime(mondayLocal, timeZone),
    end: fromZonedTime(sundayLocal, timeZone),
  };
}

/**
 * Parse date string (YYYY-MM-DD or ISO) and time string (HH:mm) in a timezone,
 * then convert to UTC.
 */
export function localToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [year, month, day] = parseDateParts(dateStr);
  const [hour, minute] = parseTimeParts(timeStr);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return fromZonedTime(localDate, timeZone);
}

/**
 * Convert UTC date to local time string (HH:mm) in the given timezone.
 */
export function utcToLocalTimeString(utcDate: Date, timeZone: string): string {
  const zoned = toZonedTime(utcDate, timeZone);
  return format(zoned, 'HH:mm');
}

/**
 * Get the local date (YYYY-MM-DD) of a UTC timestamp in the given timezone.
 */
export function utcToLocalDateString(utcDate: Date, timeZone: string): string {
  const zoned = toZonedTime(utcDate, timeZone);
  return format(zoned, 'yyyy-MM-dd');
}

function parseDateParts(dateStr: string): [number, number, number] {
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return [y, m, d];
}

function parseTimeParts(timeStr: string): [number, number] {
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    return [h, m];
  }
  const d = new Date(timeStr);
  return [d.getHours(), d.getMinutes()];
}
