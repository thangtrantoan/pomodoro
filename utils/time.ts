/** Số phút → ms */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * `MM:SS` — đồng hồ đếm ngược và "phiên trung vị". Luôn pad 2 chữ số để bề rộng
 * không nhảy (đi kèm `fontVariant: ['tabular-nums']` ở phía render).
 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * `H:MM` — tổng thời gian đã tập trung ("Focused today 2:05"). Giờ không pad,
 * phút pad 2 chữ số, đúng như design.
 */
export function formatHours(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
