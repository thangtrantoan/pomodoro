import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { CHIME_SOURCE } from '../constants/chime';
import { useSettingsStore } from '../store/settingsStore';
import { useTimerStore } from '../store/timerStore';
import { successFeedback } from '../utils/haptics';

/**
 * Chuông báo hết phiên, phát **từ trong app**.
 *
 * Trước đây tiếng báo duy nhất là tiếng mặc định của notification hệ thống — phụ thuộc
 * quyền thông báo, chế độ im lặng, và độ chính xác của alarm; mà trên Android 12+ thì
 * alarm inexact còn bị chính app huỷ mất trước khi kịp bắn (xem `utils/notifications.ts`).
 * Chuông trong app không dính thứ nào trong số đó: app đang mở là chắc chắn kêu.
 *
 * Notification vẫn giữ nguyên vai trò của nó — báo khi user đã khoá màn hình hoặc chuyển
 * sang app khác, lúc JS thread không còn tick.
 */
export function useSessionChime(): void {
  const chime = useSettingsStore((s) => s.flags.chime);
  const player = useAudioPlayer(CHIME_SOURCE);

  // Đọc cờ qua ref thay vì đưa vào deps: gạt công tắc trong Settings không có lý do gì
  // phải huỷ rồi đăng ký lại subscription
  const enabled = useRef(chime);
  enabled.current = chime;

  // Nhạc nền chạy ở 25–40%, chuông thì không — nó là tín hiệu, phải nghe rõ
  useEffect(() => {
    player.volume = 1;
  }, [player]);

  useEffect(() => {
    return useTimerStore.subscribe((state, prev) => {
      if (state.endedTick === prev.endedTick) return;
      if (!enabled.current) return;
      // Tua về 0 trước: player đã chạy hết file thì `play()` không tự quay lại đầu, nên
      // phiên thứ hai trở đi sẽ im
      void player.seekTo(0);
      player.play();
      successFeedback();
    });
  }, [player]);
}
