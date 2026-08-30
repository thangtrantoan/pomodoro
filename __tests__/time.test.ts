import { formatClock, formatHours, minutesToMs } from '../utils/time';

describe('formatClock', () => {
  it('pads to MM:SS', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(9 * 1000)).toBe('00:09');
    expect(formatClock(minutesToMs(25))).toBe('25:00');
    expect(formatClock(minutesToMs(17) + 42 * 1000)).toBe('17:42');
  });

  it('không trả số âm khi đồng hồ chạy quá mốc', () => {
    expect(formatClock(-5000)).toBe('00:00');
  });

  it('vượt 60 phút thì dồn hết vào phần phút', () => {
    expect(formatClock(minutesToMs(90))).toBe('90:00');
  });
});

describe('formatHours', () => {
  it('trả H:MM, giờ không pad', () => {
    expect(formatHours(minutesToMs(125))).toBe('2:05');
    expect(formatHours(minutesToMs(75))).toBe('1:15');
    expect(formatHours(minutesToMs(450))).toBe('7:30');
    expect(formatHours(0)).toBe('0:00');
  });
});
