# 18 — Công tắc tắt thông báo hết phiên

Hiện tại notification hết phiên/hết nghỉ luôn được hẹn, cờ `chime` chỉ điều khiển *tiếng*.
Thêm `notify` để tắt hẳn.

**Đánh đổi phải nói rõ trong hint:** notification bắn ra là cú đánh thức native duy nhất
khi màn hình tắt mà không bật nhạc nền (`onSessionEndDelivered` → `sync()`). Tắt đi thì
phiên chỉ được chốt lúc user mở lại app.

Cờ `ongoing` (đồng hồ thường trực trên màn khoá) là chuyện khác, không gộp vào đây.

## Checklist

- [x] `types/index.ts`: thêm `'notify'` vào `FlagKey`
- [x] `store/settingsStore.ts`: `DEFAULT_FLAGS.notify = true`
- [x] `hooks/useNotificationSync.ts`: `!notify` → `cancelSessionEnd()` và không hẹn lịch mới
- [x] `app/settings.tsx`: công tắc `notify` ngay trên `chime`; ẩn khối cảnh báo
      "Thông báo đang bị chặn" khi `notify` đã tắt (không còn gì để cảnh báo)
- [x] `constants/i18n.ts`: `settings.notify` + `settings.notifyHint` (ghi rõ đánh đổi) — `vi` + `en`
