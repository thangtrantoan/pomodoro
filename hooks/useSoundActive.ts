import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { findTrack, trackSource } from '../constants/tracks';
import { findTick, tickSource } from '../constants/ticks';
import type { Phase, SoundChoice, TimerStatus } from '../types';

/**
 * "Lúc này âm thanh trong phiên có nên đang phát không" — một định nghĩa duy nhất, vì có ba
 * nơi cần hỏi cùng câu đó: `useSessionSound` (phát/dừng), callback native của player (dừng
 * khi không còn render nào chạy), và `useNotificationSync` (ẩn đồng hồ thường trực khi media
 * notification đã chiếm chỗ).
 */

/** Asset đã `require()` của lựa chọn hiện tại; `null` = tắt, hoặc id không tra ra gì */
export function soundSource(sound: SoundChoice | null): number | null {
  if (sound === null) return null;

  if (sound.kind === 'track') {
    const track = findTrack(sound.id);
    return track === null ? null : trackSource(track);
  }

  const tick = findTick(sound.id);
  return tick === null ? null : tickSource(tick);
}

/**
 * Phần **cấu hình** của quy tắc, tách riêng vì màn Settings cần đúng câu này: lúc đứng ở
 * Settings chưa có phiên nào chạy, nhưng vẫn phải nói trước được rằng khi vào phiên thì
 * media notification của trình phát sẽ chiếm chỗ đồng hồ thường trực trên màn khoá.
 *
 * `null` ở đây cũng bắt được state persist trỏ vào một id đã gỡ khỏi app.
 */
export function soundPlayable(sound: SoundChoice | null): boolean {
  return soundSource(sound) !== null;
}

function isActive(
  sound: SoundChoice | null,
  tickInBreak: boolean,
  phase: Phase,
  status: TimerStatus,
): boolean {
  if (!soundPlayable(sound) || status !== 'running') return false;
  if (phase === 'focus') return true;
  // Giờ nghỉ: nhạc nền luôn im (nghỉ là để rời màn hình, màn Break đã bảo "nhìn ra xa hơn
  // sáu mét"), chỉ tiếng tick được phát tiếp và chỉ khi user chủ động bật
  return sound !== null && sound.kind === 'tick' && tickInBreak;
}

/** Bản subscribe — dùng trong thân component/hook */
export function useSoundActive(): boolean {
  const sound = useAudioStore((s) => s.sound);
  const tickInBreak = useAudioStore((s) => s.tickInBreak);
  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);
  return isActive(sound, tickInBreak, phase, status);
}

/**
 * Bản đọc một lần — dùng trong callback do native gọi, lúc không có render nào để bám vào.
 * Chờ một lần render khi app ở nền là không chắc chắn: scheduler của React cũng xếp hàng qua
 * timer, mà timer thì đã bị gỡ.
 */
export function soundActiveNow(): boolean {
  const { sound, tickInBreak } = useAudioStore.getState();
  const { phase, status } = useTimerStore.getState();
  return isActive(sound, tickInBreak, phase, status);
}
