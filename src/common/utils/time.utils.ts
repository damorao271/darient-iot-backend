/** Parse HH:mm or ISO datetime to minutes since midnight (0-1439) */
export function parseTimeToMinutes(timeStr: string): number {
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
  const date = new Date(timeStr);
  return date.getHours() * 60 + date.getMinutes();
}
