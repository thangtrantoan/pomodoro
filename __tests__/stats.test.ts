import { computeStreak, deriveStats, median } from '../utils/stats';
import { getDateStrOffset, getLocalDateStr } from '../utils/date';
import { minutesToMs } from '../utils/time';
import type { SessionLog } from '../types';

const NOW = new Date(2026, 7, 30, 14, 0, 0); // 30/08/2026, giờ địa phương

function session(dayOffset: number, overrides: Partial<SessionLog> = {}): SessionLog {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + dayOffset, 10, 0, 0);
  return {
    id: `s${dayOffset}-${Math.random()}`,
    taskId: 't1',
    taskName: 'Task',
    startedAt: d.getTime() - minutesToMs(25),
    endedAt: d.getTime(),
    durationMs: minutesToMs(25),
    plannedMs: minutesToMs(25),
    completed: true,
    ...overrides,
  };
}

describe('median', () => {
  it('mảng rỗng trả 0', () => {
    expect(median([])).toBe(0);
  });

  it('lẻ thì lấy phần tử giữa, chẵn thì trung bình hai phần tử giữa', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('computeStreak', () => {
  it('đếm lùi các ngày liên tiếp có phiên', () => {
    const days = new Set([
      getLocalDateStr(NOW),
      getDateStrOffset(-1, NOW),
      getDateStrOffset(-2, NOW),
    ]);
    expect(computeStreak(days, NOW)).toBe(3);
  });

  it('hôm nay chưa tập nhưng hôm qua có thì chuỗi vẫn còn', () => {
    const days = new Set([getDateStrOffset(-1, NOW), getDateStrOffset(-2, NOW)]);
    expect(computeStreak(days, NOW)).toBe(2);
  });

  it('bỏ trọn một ngày thì chuỗi đứt', () => {
    const days = new Set([getDateStrOffset(-2, NOW), getDateStrOffset(-3, NOW)]);
    expect(computeStreak(days, NOW)).toBe(0);
  });

  it('không có phiên nào thì chuỗi bằng 0', () => {
    expect(computeStreak(new Set(), NOW)).toBe(0);
  });
});

describe('deriveStats', () => {
  it('tách phiên hôm nay khỏi phiên cũ', () => {
    const stats = deriveStats([session(0), session(0), session(-3)], NOW);
    expect(stats.sessionsToday).toBe(2);
    expect(stats.focusedTodayMs).toBe(minutesToMs(50));
  });

  it('phiên kết thúc sớm tính là gián đoạn, không tính là hoàn thành', () => {
    const stats = deriveStats(
      [session(0), session(0, { completed: false, durationMs: minutesToMs(10) })],
      NOW,
    );
    expect(stats.sessionsToday).toBe(1);
    expect(stats.interruptionsToday).toBe(1);
    // Thời gian đã ngồi làm vẫn được cộng dù phiên bỏ dở
    expect(stats.focusedTodayMs).toBe(minutesToMs(35));
    expect(stats.completionRate).toBe(0.5);
  });

  it('trả đúng 7 cột, cũ → mới, cột cuối là hôm nay', () => {
    const stats = deriveStats([session(0), session(-6)], NOW);
    expect(stats.week).toHaveLength(7);
    expect(stats.week[6].count).toBe(1);
    expect(stats.week[0].count).toBe(1);
    expect(stats.week[3].count).toBe(0);
  });

  it('không có phiên nào thì mọi số bằng 0, không chia cho 0', () => {
    const stats = deriveStats([], NOW);
    expect(stats.completionRate).toBe(0);
    expect(stats.medianSessionMs).toBe(0);
    expect(stats.dayStreak).toBe(0);
  });
});
