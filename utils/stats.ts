import type { DerivedStats, SessionLog } from '../types';
import { getDateStrOffset, getLocalDateStr, isoWeekday } from './date';

/** Trung vị — mảng rỗng trả 0, mảng chẵn lấy trung bình 2 phần tử giữa */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Chuỗi ngày liên tiếp có ít nhất 1 phiên hoàn thành, tính lùi từ hôm nay.
 * Chưa tập hôm nay nhưng có hôm qua thì chuỗi vẫn còn — chỉ đứt khi bỏ trọn một ngày.
 */
export function computeStreak(daysWithSessions: Set<string>, now: Date = new Date()): number {
  if (daysWithSessions.size === 0) return 0;

  // Hôm nay chưa tập thì bắt đầu đếm từ hôm qua, chuỗi chưa bị coi là đứt
  let offset = daysWithSessions.has(getLocalDateStr(now)) ? 0 : -1;
  if (offset === -1 && !daysWithSessions.has(getDateStrOffset(-1, now))) return 0;

  let streak = 0;
  while (daysWithSessions.has(getDateStrOffset(offset, now))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

/**
 * Dựng toàn bộ số liệu màn Record và Done từ log phiên.
 * "Tuần này" tính theo tuần ISO (bắt đầu Thứ Hai), khớp nhãn `record.days`.
 */
export function deriveStats(sessions: SessionLog[], now: Date = new Date()): DerivedStats {
  const todayStr = getLocalDateStr(now);
  const completed = sessions.filter((s) => s.completed);

  const dayOf = (s: SessionLog) => getLocalDateStr(new Date(s.endedAt));

  const todaySessions = sessions.filter((s) => dayOf(s) === todayStr);
  const todayCompleted = todaySessions.filter((s) => s.completed);

  const mondayOffset = -isoWeekday(now);
  const weekStartStr = getDateStrOffset(mondayOffset, now);
  const thisWeek = completed.filter((s) => dayOf(s) >= weekStartStr);

  const daysWithSessions = new Set(completed.map(dayOf));

  // 7 ngày gần nhất, cũ → mới, nhãn thứ khớp thứ tự Thứ Hai-đầu-tuần của `record.days`
  const week = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 6;
    const dateStr = getDateStrOffset(offset, now);
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return {
      day: dateStr,
      weekday: isoWeekday(date),
      count: completed.filter((s) => dayOf(s) === dateStr).length,
    };
  });

  return {
    sessionsToday: todayCompleted.length,
    focusedTodayMs: todaySessions.reduce((sum, s) => sum + s.durationMs, 0),
    interruptionsToday: todaySessions.filter((s) => !s.completed).length,
    dayStreak: computeStreak(daysWithSessions, now),
    sessionsThisWeek: thisWeek.length,
    focusedThisWeekMs: thisWeek.reduce((sum, s) => sum + s.durationMs, 0),
    medianSessionMs: median(completed.map((s) => s.durationMs)),
    completionRate: sessions.length === 0 ? 0 : completed.length / sessions.length,
    week,
  };
}
