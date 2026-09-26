import { useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioLockScreenOptions } from 'expo-audio';
import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { findTrack } from '../constants/tracks';
import { findTick } from '../constants/ticks';
import { soundActiveNow, soundSource, useSoundActive } from './useSoundActive';
import { useLockScreenMeta } from './useLockScreenMeta';
import { useT } from './useT';
import type { SoundChoice } from '../types';

/**
 * Nhịp `playbackStatusUpdate` mà native bắn lên. 1s là đủ: sự kiện này không vẽ gì cả, nó
 * chỉ làm đồng hồ dự phòng lúc màn hình tắt.
 */
const STATUS_INTERVAL_MS = 1_000;

/** Tua tới/lui vô nghĩa với một nguồn lặp vô hạn — chỉ để lại play/pause */
const LOCK_SCREEN: AudioLockScreenOptions = { showSeekForward: false, showSeekBackward: false };

/**
 * Âm thanh trong phiên — nhạc nền hoặc tiếng tick, **một player duy nhất**.
 *
 * Trước đây là hai hook với hai player riêng, và vì hai MediaSession của cùng một app thì
 * cái sau release cái trước nên phải có thêm một quy tắc trọng tài để chọn player nào được
 * giữ foreground service. Một nguồn duy nhất (`store/audioStore.ts`) bỏ được cả tầng đó:
 * một player, một chủ màn khoá, một listener.
 *
 * Bám thẳng vào `timerStore` qua `useSoundActive` — không có state "đang phát" riêng, nên
 * không thể lệch pha với đồng hồ (pause đồng hồ mà tiếng vẫn chạy).
 *
 * Cả hai loại nguồn đều là vòng lặp: nhạc nền lặp cả bài, tiếng tick lặp một file 2 giây có
 * sẵn hai nhịp (xem `constants/ticks.ts`). Nên `loop = true` đúng cho cả hai, và tick không
 * cần `setInterval` bắn từng tiếng — thứ sẽ tắt ngay khi app xuống nền vì React Native gỡ
 * sạch JS timer.
 */
export function useSessionSound(): void {
  const t = useT();
  const sound = useAudioStore((s) => s.sound);
  const volume = useAudioStore((s) => s.volume);

  const source = soundSource(sound);
  const player = useAudioPlayer(source ?? undefined, { updateInterval: STATUS_INTERVAL_MS });

  const shouldPlay = useSoundActive();

  /**
   * Media notification là notification duy nhất của app khi có tiếng đang phát
   * (`useNotificationSync` ẩn đồng hồ thường trực để không có hai dòng chồng nhau), nên nó
   * phải nói được chuyện phiên chứ không chỉ chuyện âm thanh. Ba dòng map thẳng vào
   * `AudioControlsService.buildNotification()`:
   *
   *     albumTitle -> setSubText      "Study Lofi Music · Alex Morgan"
   *     title      -> setContentTitle "Phiên 2 / 4"
   *     artist     -> setContentText  "Viết báo cáo quý 3"
   */
  const { title, artist } = useLockScreenMeta();
  const albumTitle = subTextFor(sound, t.sound.tickNames);

  // Lúc kích hoạt cần metadata hiện tại, nhưng metadata đổi thì KHÔNG được kích hoạt lại:
  // `setActivePlayerInternal` release rồi dựng lại cả MediaSession mỗi lần gọi
  const metadata = useRef({ title, artist, albumTitle });
  metadata.current = { title, artist, albumTitle };

  useEffect(() => {
    void setAudioModeAsync({
      // Tiếng phải sống tiếp khi tắt màn — đây mới là lúc user đang tập trung
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      // Chồng lên nhạc của app khác thay vì cướp audio focus: user đang mở Spotify thì đó là
      // lựa chọn của họ, app này không có quyền dừng
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    player.loop = true;
  }, [player]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  /**
   * `setActiveForLockScreen` không chỉ để đẹp: nó là thứ khởi động `AudioControlsService`
   * của expo-audio — một foreground service `mediaPlayback` kèm MediaSession
   * (`AudioControlsService.kt` gọi `startForegroundService`).
   *
   * Thiếu nó, app phát tiếng mà **không giữ audio focus** (`AudioModule.kt` bỏ qua
   * `requestAudioFocus()` khi `interruptionMode == MIX_WITH_OTHERS`, mà app đang đặt đúng
   * mode đó), **không foreground service**, **không MediaSession** — đúng hồ sơ mà Android
   * đóng băng sau vài phút tắt màn hình. Tiếng im, và vì process bị đóng băng nên
   * `playbackStatusUpdate` bên dưới cũng ngừng, đồng hồ đứng theo.
   */
  useEffect(() => {
    if (shouldPlay) {
      player.setActiveForLockScreen(true, metadata.current, LOCK_SCREEN);
      player.play();
    } else {
      player.pause();
      player.setActiveForLockScreen(false);
    }
  }, [shouldPlay, player]);

  // Đổi phiên / đổi việc / đổi nguồn thì chỉ post lại nội dung, không đụng tới session.
  // Deps là từng chuỗi rời chứ không phải một object: object mới mỗi lần render sẽ post lại
  // cả notification ở mọi nhịp đồng hồ.
  useEffect(() => {
    if (!shouldPlay) return;
    player.updateLockScreenMetadata({ title, artist, albumTitle });
  }, [shouldPlay, player, title, artist, albumTitle]);

  /**
   * Đồng hồ dự phòng khi màn hình tắt.
   *
   * React Native **gỡ toàn bộ JS timer** lúc app xuống nền — Android:
   * `JavaTimerManager.onHostPause()` gọi `clearFrameCallback()`; iOS: `RCTTiming`
   * `appDidMoveToBackground` gọi `stopTimers()` rồi chặn `startTimers()`. Nên `setInterval`
   * trong `useCountdown` đứng hình và `sync()` không chạy.
   *
   * `playbackStatusUpdate` thì do native bắn lên chứ không qua timer, nên vẫn tới: JS thread
   * không hề chết, chỉ có timer bị gỡ. Tiếng đang phát tự nó thành nhịp đồng hồ — với điều
   * kiện process còn sống, tức là phải có foreground service ở effect trên.
   */
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', () => {
      useTimerStore.getState().sync();

      // Dừng ngay tại đây thay vì đợi effect ở trên: effect cần một lần render, mà render lúc
      // app ở nền thì không có gì bảo đảm sẽ chạy — bản thân scheduler của React cũng xếp
      // hàng qua timer. Không gỡ lock screen ở đây: làm thế là tự tắt foreground service
      // đúng lúc chuông báo hết phiên còn đang kêu.
      if (player.playing && !soundActiveNow()) player.pause();
    });
    return () => sub.remove();
  }, [player]);
}

/** Dòng `setSubText` của media notification — tên bài kèm tác giả, hoặc tên tiếng tick */
function subTextFor(sound: SoundChoice | null, tickNames: Record<string, string>): string {
  if (sound === null) return '';

  if (sound.kind === 'track') {
    const track = findTrack(sound.id);
    return track === null ? '' : `${track.title} · ${track.artist}`;
  }

  const tick = findTick(sound.id);
  return tick === null ? '' : (tickNames[tick.id] ?? '');
}
