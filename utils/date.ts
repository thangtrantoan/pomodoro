/**
 * `YYYY-MM-DD` theo giờ địa phương (không dùng toISOString — nó quy về UTC nên
 * lệch ngày với các múi giờ dương như VN vào buổi tối).
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM-DD` của ngày cách hôm nay `offset` ngày (âm = quá khứ) */
export function getDateStrOffset(offset: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
  return getLocalDateStr(d);
}

/** Thứ trong tuần theo chuẩn ISO: 0 = Thứ Hai … 6 = Chủ Nhật */
export function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}
