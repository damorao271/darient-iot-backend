import { getWeekBounds } from './week.utils';

describe('getWeekBounds', () => {
  it('returns start before end', () => {
    const date = new Date('2025-03-26T12:00:00');
    const { start, end } = getWeekBounds(date);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it('start is at midnight', () => {
    const date = new Date('2025-03-26T12:00:00');
    const { start } = getWeekBounds(date);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it('end is at 23:59:59.999', () => {
    const date = new Date('2025-03-26T12:00:00');
    const { end } = getWeekBounds(date);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });

  it('week contains the given date', () => {
    const date = new Date('2025-03-26T12:00:00');
    const { start, end } = getWeekBounds(date);
    expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('same week bounds for dates in same Mon-Sun week', () => {
    const wed = new Date('2025-03-26T12:00:00');
    const thu = new Date('2025-03-27T12:00:00');
    const { start: startWed, end: endWed } = getWeekBounds(wed);
    const { start: startThu, end: endThu } = getWeekBounds(thu);
    expect(startWed.getTime()).toBe(startThu.getTime());
    expect(endWed.getTime()).toBe(endThu.getTime());
  });
});
