# 12 — Android đóng băng process, nhạc tắt giữa phiên

## Bối cảnh

User báo tiếp: chạy phiên có nhạc nền, tắt màn hình ~5 phút thì **nhạc im hẳn dù phiên
vẫn còn**. Ngược hẳn triệu chứng ở task 11 (nhạc chạy tràn qua mốc), nhưng hoá ra cùng
một gốc, và gốc đó nằm sâu hơn chỗ task 11 dừng lại.

App phát nhạc nền mà thiếu cả ba thứ Android dùng để quyết định "process này còn đáng
sống":

1. **Không giữ audio focus.** `AudioModule.kt:118` — `requestAudioFocus()` return ngay
   khi `interruptionMode == MIX_WITH_OTHERS`, mà app đặt đúng mode đó (cố ý, để không
   cướp nhạc của Spotify).
2. **Không có foreground service.** expo-audio có sẵn `AudioControlsService`
   (`foregroundServiceType="mediaPlayback"`) trong manifest, nhưng nó chỉ khởi động qua
   `player.setActiveForLockScreen(true)` → `startForegroundService()`
   (`AudioControlsService.kt:366`). App chưa gọi bao giờ.
3. **Không có MediaSession** — hệ quả của (2).

Tắt màn hình vài phút là Doze đóng băng process. Nhạc im.

**Và đó cũng là lý do fix của task 11 chưa đủ:** process bị đóng băng thì
`playbackStatusUpdate` cũng ngừng bắn, đồng hồ đứng theo. Task 11 dừng ở tầng JS timer
của React Native, chưa xuống tới tầng vòng đời process của Android. Thứ duy nhất sống
sót là `onSessionEndDelivered`, vì AlarmManager đánh thức process từ bên ngoài.

Quyết định của user: bật foreground service, và **ẩn luôn đồng hồ thường trực tự làm khi
nhạc đang phát** để không có hai notification của cùng một app chồng nhau.

## Checklist

- [x] `hooks/useMusicActive.ts` — file mới. Một định nghĩa duy nhất cho "nhạc có nên đang
      phát không", vì giờ ba nơi cùng hỏi câu đó. Hai bản: `useMusicActive()` để subscribe
      trong render, `musicActiveNow()` để đọc trong callback native.
- [x] `hooks/useBackgroundMusic.ts` — `setActiveForLockScreen(true, { title, artist })`
      khi phát, `false` khi dừng. Đây là thứ khởi động foreground service.
- [x] `hooks/useBackgroundMusic.ts` — bỏ điều kiện `shouldPlay` viết tay, dùng
      `useMusicActive()`; listener dùng `musicActiveNow()`
- [x] `hooks/useNotificationSync.ts` — ẩn đồng hồ thường trực khi `musicActive`
- [x] `__tests__/musicActive.test.ts` — 6 test khoá quy tắc, gồm cả nhánh `trackId`
      persist từ bản cũ trỏ vào track đã gỡ
- [x] `hooks/useBackgroundMusic.ts` — nhét thông tin phiên vào chính media notification
      qua `AudioMetadata`. Map vào `AudioControlsService.buildNotification()`:
      `albumTitle` → `setSubText` (nhạc), `title` → `setContentTitle` ("Phiên 2 / 4"),
      `artist` → `setContentText` (tên việc). Media notification giờ là notification duy
      nhất của app khi bật nhạc nên nó phải nói được chuyện phiên.
- [x] `hooks/useBackgroundMusic.ts` — tách làm hai effect: kích hoạt
      (`setActiveForLockScreen`, deps chỉ `[shouldPlay, player]`) và cập nhật nội dung
      (`updateLockScreenMetadata`). Lý do: `setActivePlayerInternal` **release rồi dựng
      lại cả MediaSession** mỗi lần gọi — không thể gọi nó mỗi lần đổi chữ. Metadata lúc
      kích hoạt đi qua ref để không kéo vào deps.
- [x] `npm run typecheck`, `npm run lint` (0 lỗi), `npm test` (51 test / 6 suite — pass)

## Không đếm ngược trên media notification

Mỗi lần `updateLockScreenMetadata` là `postOrStartForegroundNotification` — post lại cả
notification. Gọi mỗi giây thì nhấp nháy và tốn pin. Chỉ đổi khi phiên / việc / track đổi.
Cùng lý do task 06 để đồng hồ thường trực nội dung tĩnh.

## Không đụng tới

- **`app.json`**: `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` đã nằm sẵn
  trong manifest của expo-audio, tự merge vào lúc build. Không cần khai thêm.
- **Listener không gỡ lock screen.** Gỡ ngay lúc phiên kết thúc là tự tắt foreground
  service đúng lúc chuông còn đang kêu. Để effect ở render kế tiếp dọn.

## Giới hạn còn lại

Foreground service chỉ tồn tại **khi có nhạc**. User tắt nhạc nền thì không có player nào,
không có service nào, process vẫn bị đóng băng như cũ — lúc đó chỉ còn notification báo
hết phiên là đáng tin. Muốn đồng hồ chạy nền cả khi không có nhạc thì phải tự dựng
foreground service riêng: dependency mới + code native, chưa hỏi user.

## Thanh tua trên media notification — đã quyết để nguyên

Thanh 02:18 / 02:54 là của **bài hát**, không phải của phiên. Đã cân nhắc đổi sang thời
gian phiên và **kết luận: không làm được bằng JS**. `AudioControlsService.kt:225` dựng
`MediaSession.Builder(this, player.ref)` thẳng trên ExoPlayer, không qua `MediaMetadata`
nào — position/duration là của file mp3. Phía JS `duration` chỉ có getter.

Các phương án đã loại, ghi lại để không điều tra lại:

- **File im lặng dài bằng phiên làm player màn khoá**, nhạc thật chạy bằng player thứ hai
  → phải ship 4 file cho 4 độ dài phiên (~8–16MB vào binary), đồng bộ pause/resume giữa
  hai player, user tua một cái là lệch hết.
- **Patch native** (`ForwardingPlayer` ghi đè `getDuration`/`getCurrentPosition`) → cần
  `patch-package`, buộc rời Expo Go, và vỡ mỗi lần nâng expo-audio. Không đáng cho một
  dòng số.
- **Bỏ media notification** → mất foreground service, hủy bỏ chính task này.

Thông tin có nghĩa (phiên mấy, việc gì) đã nằm ở `title`/`artist`; thanh tua chỉ là phần
của trình phát nhạc và nó không nói sai — nhạc đang ở đúng phút đó thật.

## Đính chính: foreground service KHÔNG cần build lại

`setActiveForLockScreen` là lệnh JS gọi xuống native code đã có sẵn trong client — reload
JS là đủ, media notification hiện ngay. Chỉ `SCHEDULE_EXACT_ALARM` (task 10) mới cần
build vì đó là permission trong AndroidManifest.

**Và user đang chạy Expo Go** (không có `expo-dev-client` trong deps, `eas.json` không có
profile `development`). Trong Expo Go, `android.permissions` ở `app.json` **không bao giờ
được áp dụng** — Expo Go dùng manifest riêng của nó. Muốn thử exact alarm phải
`eas build --profile preview`.

Notification xanh "Pomodoro" kèm nút reload mà user thấy là của Expo Go, không phải của
app. Bản release không có.

## Phải thử trên máy thật

- [ ] Bật nhạc, tắt màn hình, để hết trọn một phiên 15p → nhạc phải chạy suốt, hết phiên
      tự dừng, có chuông
- [ ] Trong lúc đó kéo màn khoá xuống → thấy media notification có nút play/pause, và
      **không** thấy đồng hồ thường trực (chỉ một dòng)
- [ ] Tắt nhạc nền, tắt màn hình, để hết phiên → chỉ notification báo hết phiên; mở app
      lên phải thấy màn Done
