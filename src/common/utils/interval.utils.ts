/**
 * Two intervals overlap if one starts before the other ends AND ends after the other starts.
 * Border case: [9:00-10:00] and [10:00-11:00] do NOT overlap (one starts exactly when another ends).
 * Overlap = startA < endB && endA > startB
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}
