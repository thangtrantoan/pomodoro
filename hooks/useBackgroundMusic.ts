import { useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioLockScreenOptions } from 'expo-audio';
import { useTimerStore } from '../store/timerStore';
import { useAudioStore } from '../store/audioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { musicActiveNow, useMusicActive } from './useMusicActive';
import { useT } from './useT';
import { findTrack, trackSource } from '../constants/tracks';

/**
 * Nhịp `playbackStatusUpdate` mà native bắn lên. 1s là đủ: sự kiện này không vẽ gì cả,
 * nó chỉ làm đồng hồ dự phòng lúc màn hình tắt.
 */
const STATUS_INTERVAL_MS = 1_000;

/** Tua tới/lui vô nghĩa với một track lặp vô hạn — chỉ để lại play/pause */
const LOCK_SCREEN: AudioLockScreenOptions = { showSeekForward: false, showSeekBackward: false };

/**
 * Nhạc nền bám thẳng vào `timerStore` — không có state "đang phát" riêng, nên không thể
 * lệch pha với đồng hồ (pause đồng hồ mà nhạc vẫn chạy).
 */
export function useBackgroundMusic(): void {
  const t = useT();
  const trackId = useAudioStore((s) => s.trackId);
  const volume = useAudioStore((s) => s.volume);

  const track = findTrack(trackId);
  const source = track === null ? null : trackSource(track);
  const player = useAudioPlayer(source ?? undefined, { updateInterval: STATUS_INTERVAL_MS });

  const shouldPlay = useMusicActive();

  const sessionNo = useTimerStore((s) => s.sessionNo);
  const sessionsPerSet = useSettingsStore((s) => s.sessionsPerSet);
  const tasks = useTaskStore((s) => s.tasks);
  const currentTaskId = useTaskStore((s) => s.currentTaskId);

  /**
   * Media notification là notification duy nhất của app khi nhạc đang bật
   * (`useNotificationSync` ẩn đồng hồ thường trực để không có hai dòng chồng nhau), nên
   * nó phải nói được chuyện phiên chứ không chỉ chuyện nhạc. Ba dòng map thẳng vào
   * `AudioControlsService.buildNotification()`:
   *
   *     albumTitle -> setSubText      "Study Lofi Music · Alex Morgan"
   *     title      -> setContentTitle "Phiên 2 / 4"
   *     artist     -> setContentText  "Viết báo cáo quý 3"
   *
   * Cố ý **không** đếm ngược ở đây: mỗi lần đổi metadata là post lại cả notification, làm
   * mỗi giây thì vừa nhấp nháy vừa tốn pin. Đếm ngược chính xác xem trong app.
   */
  const lockTitle = t.timer.session(sessionNo, sessionsPerSet);
  const lockArtist = tasks.find((task) => task.id === currentTaskId)?.name ?? t.timer.noTask;
  const lockSubText = track === null ? '' : `${track.title} · ${track.artist}`;

  // Lúc kích hoạt cần metadata hiện tại, nhưng metadata đổi thì KHÔNG được kích hoạt lại:
  // `setActivePlayerInternal` release rồi dựng lại cả MediaSession mỗi lần gọi
  const metadata = useRef({ title: lockTitle, artist: lockArtist, albumTitle: lockSubText });
  metadata.current = { title: lockTitle, artist: lockArtist, albumTitle: lockSubText };

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

  /**
   * `setActiveForLockScreen` không chỉ để đẹp: nó là thứ khởi động `AudioControlsService`
   * của expo-audio — một foreground service `mediaPlayback` kèm MediaSession
   * (`AudioControlsService.kt` gọi `startForegroundService`).
   *
   * Thiếu nó, app phát nhạc mà **không giữ audio focus** (`AudioModule.kt` bỏ qua
   * `requestAudioFocus()` khi `interruptionMode == MIX_WITH_OTHERS`, mà app đang đặt đúng
   * mode đó), **không foreground service**, **không MediaSession** — đúng hồ sơ mà Android
   * đóng băng sau vài phút tắt màn hình. Nhạc im, và vì process bị đóng băng nên
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

  // Đổi phiên / đổi việc / đổi track thì chỉ post lại nội dung, không đụng tới session
  useEffect(() => {
    if (!shouldPlay) return;
    player.updateLockScreenMetadata({
      title: lockTitle,
      artist: lockArtist,
      albumTitle: lockSubText,
    });
  }, [shouldPlay, player, lockTitle, lockArtist, lockSubText]);

  /**
   * Đồng hồ dự phòng khi màn hình tắt.
   *
   * React Native **gỡ toàn bộ JS timer** lúc app xuống nền — Android:
   * `JavaTimerManager.onHostPause()` gọi `clearFrameCallback()`; iOS: `RCTTiming`
   * `appDidMoveToBackground` gọi `stopTimers()` rồi chặn `startTimers()`. Nên
   * `setInterval` trong `useCountdown` đứng hình và `sync()` không chạy.
   *
   * `playbackStatusUpdate` thì do native bắn lên chứ không qua timer, nên vẫn tới: JS
   * thread không hề chết, chỉ có timer bị gỡ. Nhạc đang phát tự nó thành nhịp đồng hồ —
   * với điều kiện process còn sống, tức là phải có foreground service ở effect trên.
   */
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', () => {
      useTimerStore.getState().sync();

      // Dừng nhạc ngay tại đây thay vì đợi effect ở trên: effect cần một lần render, mà
      // render lúc app ở nền thì không có gì bảo đảm sẽ chạy — bản thân scheduler của
      // React cũng xếp hàng qua timer. Không gỡ lock screen ở đây: làm thế là tự tắt
      // foreground service đúng lúc chuông báo hết phiên còn đang kêu.
      if (player.playing && !musicActiveNow()) player.pause();
    });
    return () => sub.remove();
  }, [player]);
}
