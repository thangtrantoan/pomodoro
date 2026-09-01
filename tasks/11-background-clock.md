# 11 — Đồng hồ đứng hình khi tắt màn hình

## Bối cảnh

User báo: tắt màn hình thì nhạc nền phát đúng, nhưng **hết phiên rồi nhạc vẫn chạy
tiếp**, phải mở app lên phiên mới thật sự kết thúc.

Không phải cảm giác. React Native gỡ toàn bộ JS timer khi app xuống nền — đã xác nhận
trong source của bản đang cài:

- Android — `JavaTimerManager.kt:71`
  `onHostPause() { isPaused.set(true); clearFrameCallback(); ... }`
  gỡ frame callback của Choreographer, thứ đang chạy mọi `setInterval`/`setTimeout`.
- iOS — `RCTTiming.mm:180`
  `appDidMoveToBackground` gọi `stopTimers()` rồi đặt `_inBackground = YES`; `startTimers()`
  bail ngay ở dòng đầu khi cờ này bật.

Nên `setInterval(sync, 500)` trong `useCountdown` ngừng hẳn. Nhạc thì vẫn phát vì
playback do native giữ (`shouldPlayInBackground: true`), không cần JS. `status` kẹt ở
`'running'` → `wantsMusic()` vẫn đúng → nhạc tràn qua mốc. `AppState` về `'active'` mới
`sync()`, đó là lúc user thấy "mở app lên nó mới end".

**Điểm mấu chốt:** JS thread không hề chết, chỉ có timer bị gỡ. Sự kiện do native bắn
lên vẫn chạy JS bình thường — dùng chúng làm nhịp đồng hồ.

## Checklist

- [x] `hooks/useBackgroundMusic.ts` — `useAudioPlayer(source, { updateInterval: 1000 })`
      rồi bám `playbackStatusUpdate` để gọi `sync()`. Nhạc đang phát tự nó thành đồng hồ.
- [x] `hooks/useBackgroundMusic.ts` — dừng nhạc **ngay trong listener** thay vì đợi effect:
      effect cần một lần render, mà render lúc app ở nền thì không bảo đảm chạy (scheduler
      của React cũng xếp hàng qua timer). Guard `player.playing` để `pause()` không tự
      kích lại status update thành vòng lặp.
- [x] `hooks/useBackgroundMusic.ts` — tách `wantsMusic()` làm một định nghĩa duy nhất cho
      cả đường render lẫn đường imperative
- [x] `utils/notifications.ts` — `onSessionEndDelivered()`: bám
      `addNotificationReceivedListener`, lọc `data.kind === 'session-end'`. Đây là cú đánh
      thức duy nhất khi user **không** bật nhạc nền.
- [x] `hooks/useNotificationSync.ts` — nối `onSessionEndDelivered` vào `sync()`
- [x] `__tests__/notifications.test.ts` — 2 test cho lọc `kind` và hàm gỡ đăng ký
- [x] `npm run typecheck`, `npm run lint` (0 lỗi), `npm test` (45 test — pass)

## Còn lại: phải thử trên máy thật

Cơ chế đúng về nguyên lý nhưng tần suất `playbackStatusUpdate` lúc app ở nền là do OS
quyết. Cần đo trên thiết bị thật:

- [ ] Tắt màn hình, bật nhạc nền, để hết một phiên → nhạc phải tự dừng trong ~1-2s, có
      tiếng chime
- [ ] Tắt màn hình, **tắt** nhạc nền, để hết một phiên → notification bắn, mở app lên
      thấy đã ở màn Done chứ không đếm tiếp
- [ ] Trường hợp Doze sâu (để máy yên vài chục phút) — alarm inexact có thể vẫn trễ nếu
      chưa rebuild với `SCHEDULE_EXACT_ALARM` từ task 10
