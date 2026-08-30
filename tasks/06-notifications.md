# 06 — Local notifications (thay cho artboard "Lock screen widget")

Expo managed không dựng được lock-screen widget thật. Thay bằng hành vi thật mà artboard mô tả.

- [x] `utils/notifications.ts` — channel Android, permission, schedule DATE trigger tại `endAt`
- [x] `setNotificationHandler` dùng `shouldShowBanner`/`shouldShowList` (v54; `shouldShowAlert`
      đã deprecated)
- [x] Ongoing notification khi đang focus: `content.sticky = true` (Android)
- [x] Toggle "Silence notifications" → app giữ notification của chính nó tới khi hết phiên
- [x] Toggle "End chime" → `sound` on/off
- [x] Toggle "Lock screen widget" → bật/tắt ongoing notification
- [x] `hooks/useNotificationSync.ts` — lifecycle theo timer store
