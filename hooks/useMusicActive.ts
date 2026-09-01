import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { findTrack, trackSource } from '../constants/tracks';
import type { Phase, TimerStatus } from '../types';

/**
 * "Lúc này nhạc nền có nên đang phát không" — một định nghĩa duy nhất, vì giờ có ba nơi
 * cần hỏi cùng câu đó: `useBackgroundMusic` (phát/dừng), callback native của player
 * (dừng khi không còn render nào chạy), và `useNotificationSync` (ẩn đồng hồ thường trực
 * khi media notification đã chiếm chỗ).
 *
 * Chỉ phát khi **đang chạy một phiên focus**. Giờ nghỉ thì tắt: nghỉ là để rời màn hình,
 * và màn Break đã bảo "nhìn ra xa hơn sáu mét".
 */
/**
 * Phần **cấu hình** của quy tắc, tách riêng vì màn Settings cần đúng câu này: lúc đứng ở
 * Settings chưa có phiên nào chạy, nhưng vẫn phải nói trước được rằng khi vào phiên thì
 * media notification của trình phát sẽ chiếm chỗ đồng hồ thường trực trên màn khoá.
 */
export function musicPlayable(enabled: boolean, trackId: string | null): boolean {
  const track = findTrack(trackId);
  return enabled && track !== null && trackSource(track) !== null;
}

function isActive(
  enabled: boolean,
  trackId: string | null,
  phase: Phase,
  status: TimerStatus,
): boolean {
  return musicPlayable(enabled, trackId) && phase === 'focus' && status === 'running';
}

/** Bản subscribe — dùng trong thân component/hook */
export function useMusicActive(): boolean {
  const enabled = useAudioStore((s) => s.enabled);
  const trackId = useAudioStore((s) => s.trackId);
  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);
  return isActive(enabled, trackId, phase, status);
}

/**
 * Bản đọc một lần — dùng trong callback do native gọi, lúc không có render nào để bám
 * vào. Xem `useBackgroundMusic`: chờ một lần render lúc app đang ở nền là không chắc
 * chắn, scheduler của React cũng xếp hàng qua timer mà timer thì đã bị gỡ.
 */
export function musicActiveNow(): boolean {
  const { enabled, trackId } = useAudioStore.getState();
  const { phase, status } = useTimerStore.getState();
  return isActive(enabled, trackId, phase, status);
}
