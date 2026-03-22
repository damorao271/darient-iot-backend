import { parseTimeToMinutes } from './time.utils';

describe('parseTimeToMinutes', () => {
  it('parses HH:mm format correctly', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('09:00')).toBe(540);
    expect(parseTimeToMinutes('12:30')).toBe(750);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('parses single-digit hour HH:mm format', () => {
    expect(parseTimeToMinutes('9:00')).toBe(540);
  });

  it('parses ISO datetime and extracts local time', () => {
    const result = parseTimeToMinutes('2025-03-22T14:30:00.000Z');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1439);
  });
});
