import { intervalsOverlap } from './interval.utils';

describe('intervalsOverlap', () => {
  it('returns true when intervals overlap', () => {
    expect(intervalsOverlap(540, 600, 570, 630)).toBe(true); // 9:00-10:00 and 9:30-10:30
    expect(intervalsOverlap(570, 630, 540, 600)).toBe(true);
    expect(intervalsOverlap(540, 630, 600, 660)).toBe(true); // one contains the other
  });

  it('returns false when intervals do not overlap', () => {
    expect(intervalsOverlap(540, 600, 600, 660)).toBe(false); // 9:00-10:00 and 10:00-11:00 (back-to-back)
    expect(intervalsOverlap(600, 660, 540, 600)).toBe(false);
    expect(intervalsOverlap(540, 600, 660, 720)).toBe(false); // 9:00-10:00 and 11:00-12:00
  });

  it('returns false when one starts exactly when another ends', () => {
    expect(intervalsOverlap(540, 600, 600, 660)).toBe(false);
  });
});
