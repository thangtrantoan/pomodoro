# 09 — Giữ sáng màn hình + sửa notification im lặng

## Bối cảnh

User báo 4 vấn đề trải nghiệm:

1. Muốn giữ sáng màn hình khi đang chạy phiên.
2. Khi khoá màn hình không thấy đồng hồ đếm ngược dạng thông báo.
3. Chuyển sang app khác không thấy thanh thông báo kéo từ trên xuống để quay lại nhanh.
4. Hết phiên chỉ tắt nhạc nền, không có tiếng báo nào khác.

Điều tra: #2, #3, #4 cùng một root cause — `Notifications.setNotificationHandler` chưa
từng được set. Theo doc expo-notifications: "The default behavior when the handler is
not set ... is not to show the notification." Nghĩa là notification "ongoing" (đồng hồ
thường trực) và notification báo hết phiên **chưa từng hiện/kêu**, kể cả khi app đang
chạy nền (JS thread còn sống) — không phải do thiếu tính năng, code ongoing notification
với sticky + tiếng báo hết phiên đã có sẵn từ trước, chỉ bị handler thiếu chặn lại.

`expo-keep-awake` là dependency mới — đã hỏi user, được duyệt.

## Checklist

- [x] Cài `expo-keep-awake` qua `npx expo install`
- [x] `types/index.ts`: thêm `'keepAwake'` vào `FlagKey`, bỏ dòng comment "chưa được duyệt"
- [x] `store/settingsStore.ts`: thêm `keepAwake: true` vào `DEFAULT_FLAGS`
- [x] `constants/i18n.ts`: thêm `settings.keepAwake` / `settings.keepAwakeHint` (vi + en)
- [x] `app/settings.tsx`: thêm toggle row cho `keepAwake`
- [x] `hooks/useKeepAwakeSync.ts`: hook mới, activate/deactivate keep-awake theo
      `status === 'running'` + flag `keepAwake`
- [x] `app/_layout.tsx`: gắn `useKeepAwakeSync()` vào `AppShell`
- [x] `utils/notifications.ts`: thêm `configureNotificationHandler()`
- [x] `hooks/useNotificationSync.ts`: gọi `configureNotificationHandler()` lúc mount
- [x] `npm run typecheck`
- [x] Sửa `__tests__/timerStore.test.ts` (thiếu field `keepAwake` mới trong `Flags`)
- [x] Batch cuối: `npm run lint`, `npm test` (cần user confirm)
