import type { TickId, TickSound } from '../types';

/**
 * Tiếng tick-tock phát trong lúc chạy phiên. `require()` phải tĩnh — Metro không nhận
 * đường dẫn ghép chuỗi lúc chạy, y hệt ràng buộc ở `constants/tracks.ts`.
 *
 * Mỗi file là **một vòng lặp 2 giây**: `tick` ở 0.0s, `tock` ở 1.0s, rồi im tới hết file.
 * Phát bằng `player.loop = true` nên cả phiên chỉ cần một lần `play()`.
 *
 * Đây là lý do không dùng `setInterval` bắn một tiếng mỗi giây: React Native gỡ sạch JS
 * timer khi app xuống nền (xem chú thích dài trong `hooks/useSessionSound.ts`), nên
 * tiếng tick sẽ tắt đúng lúc user tắt màn hình để tập trung. Vòng lặp thì do native giữ.
 *
 * File tự sinh bằng ffmpeg — 22.05kHz mono 16-bit, đỉnh -1.0 dBFS, 86KB/file. Lệnh sinh
 * ghi ở `assets/audio/README.md`. Không có giấy phép nào phải credit, nên màn
 * `app/licenses.tsx` chỉ liệt kê nhạc nền.
 */
const TICK_SOURCES = {
  soft: require('../assets/audio/tick-soft.wav'),
  clock: require('../assets/audio/tick-clock.wav'),
  wood: require('../assets/audio/tick-wood.wav'),
} satisfies Record<TickId, number>;

type SourceKey = keyof typeof TICK_SOURCES;

/** `TickSound` nhưng `source` bị buộc về đúng key của `TICK_SOURCES` — gõ sai là báo đỏ */
export type ManifestTick = Omit<TickSound, 'source'> & { source: SourceKey };

/** Thứ tự ở đây là thứ tự hiện trong Settings: nhẹ nhất trước */
export const TICKS: ManifestTick[] = [
  { id: 'soft', source: 'soft' },
  { id: 'clock', source: 'clock' },
  { id: 'wood', source: 'wood' },
];

const SOURCE_LOOKUP: Record<string, number> = TICK_SOURCES;

/** Asset đã `require()` của một tiếng tick, `null` nếu không tìm thấy */
export function tickSource(tick: TickSound): number | null {
  return SOURCE_LOOKUP[tick.source] ?? null;
}

export function findTick(id: string | null): TickSound | null {
  if (id === null) return null;
  return TICKS.find((tick) => tick.id === id) ?? null;
}
