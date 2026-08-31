import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { findTrack, trackSource } from '../constants/tracks';

/**
 * Nhạc nền bám thẳng vào `timerStore` — không có state "đang phát" riêng, nên không thể
 * lệch pha với đồng hồ (pause đồng hồ mà nhạc vẫn chạy).
 *
 * Chỉ phát khi **đang chạy một phiên focus**. Giờ nghỉ thì tắt: nghỉ là để rời màn hình,
 * và màn Break đã bảo "nhìn ra xa hơn sáu mét".
 */
export function useBackgroundMusic(): void {
  const enabled = useAudioStore((s) => s.enabled);
  const trackId = useAudioStore((s) => s.trackId);
  const volume = useAudioStore((s) => s.volume);

  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);

  const track = findTrack(trackId);
  const source = track === null ? null : trackSource(track);
  const player = useAudioPlayer(source ?? undefined);

  const shouldPlay = enabled && source !== null && phase === 'focus' && status === 'running';

  useEffect(() => {
    void setAudioModeAsync({
      // Nhạc phải sống tiếp khi tắt màn — đây mới là lúc user đang tập trung
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      // Chồng lên nhạc của app khác thay vì cướp audio focus: user đang mở Spotify thì
      // đó là lựa chọn của họ, app này không có quyền dừng
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    player.loop = true;
  }, [player]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    if (shouldPlay) player.play();
    else player.pause();
  }, [shouldPlay, player]);
}
