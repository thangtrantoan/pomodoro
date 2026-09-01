# 10 — Chuông báo hết phiên (thật sự kêu)

## Bối cảnh

User báo lại: hết phiên vẫn không nghe tiếng gì. Task 09 đã sửa
`setNotificationHandler` — đúng nhưng mới là điều kiện cần. Điều tra tiếp ra hai
nguyên nhân nữa:

**1. App không tự phát tiếng nào.** Nguồn tiếng duy nhất là tiếng mặc định của
notification hệ thống (`sound: opts.chime`). `useBackgroundMusic` chỉ *tắt* nhạc nền
khi hết phiên. `successFeedback()` viết từ task 03 nhưng chưa gọi ở đâu.

**2. App tự huỷ đúng cái notification đó.** `useNotificationSync` huỷ lịch mỗi khi
`status !== 'running'` — mà hết giờ tự nhiên chính là lúc `status` rời `'running'`.
Trình tự: tick 500ms → `sync()` thấy quá `endAt` → set `'completed'` → effect chạy →
`cancelSessionEnd()`. Cửa sổ 0–500ms này app luôn thắng trên Android 12+, vì
expo-notifications rơi xuống alarm **inexact** (`setAndAllowWhileIdle`) khi
`canScheduleExactAlarms()` = false, mà app chưa khai `SCHEDULE_EXACT_ALARM`.

Quyết định của user: tự tổng hợp chime sạch bản quyền (file wav user gửi có metadata
`bext` ghi nguồn Y2Mate/YouTube — không có giấy phép để nhúng vào bản phát hành), và
duyệt sửa `app.json` thêm hai quyền exact alarm.

## Checklist

- [x] `assets/audio/chime.wav` — ffmpeg tổng hợp: sine 880Hz + bội âm 2x/3x, decay 1.3s,
      16-bit mono 44.1kHz, đỉnh -1.0 dBFS, 115KB
- [x] `constants/chime.ts` — `require()` tĩnh cho file trên
- [x] `store/timerStore.ts` — thêm `endedTick`, chỉ tăng khi hết giờ tự nhiên và còn
      "tươi" (< 2s); `partialize` để không persist tick
- [x] `hooks/useSessionChime.ts` — hook mới: phát chime + `successFeedback()` khi
      `endedTick` nhảy, tôn trọng `flags.chime`
- [x] `app/_layout.tsx` — gắn `useSessionChime()` vào `AppShell`
- [x] `utils/notifications.ts` — nhớ thêm `scheduledEndAt`; `cancelSessionEnd()` không
      huỷ khi đã tới hạn (bỏ race)
- [x] `app.json` — thêm `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM`
- [x] `hooks/useNotificationPermission.ts` — hook mới, kiểm lại khi app về foreground
- [x] `constants/i18n.ts` — `settings.notifBlocked` / `notifBlockedHint` (vi + en)
- [x] `app/settings.tsx` — khối cảnh báo khi mất quyền thông báo, chạm mở cài đặt hệ thống
- [x] `__tests__/timerStore.test.ts` — reset `endedTick`, thêm 5 test cho tín hiệu chuông
- [x] `__tests__/notifications.test.ts` — file mới, 3 test khoá lại đúng race đã sửa
- [x] `npm run typecheck`
- [x] Batch cuối: `npm run lint` (0 lỗi), `npm test` (43 test, 5 suite — pass)

## Ngoài phạm vi

- `assets/audio/sfxding.wav` giữ nguyên trong thư mục, không require ở đâu. User tự
  quyết xoá hay không.
