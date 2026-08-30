# 05 — Queue · Record · Settings

- [x] `app/queue.tsx` — FlatList task, dot + name + meta + count, Add task (PromptSheet),
      long-press → ConfirmDeleteSheet
- [x] `app/record.tsx` — Focused today + Day streak, biểu đồ 7 ngày, 2x2 record stats
- [x] `app/settings.tsx` — Focus length segmented (15/25/45/50), toggle rows, footer
- [x] Toggle "Keep screen awake" của design **bị bỏ**: cần `expo-keep-awake`, user không
      duyệt thêm dependency. Ghi lại ở đây để sau bật lại chỉ là 1 dòng.
- [x] 4 toggle còn lại đều nối vào hành vi thật (xem task 06)

## Ghi chú phát sinh
- Bỏ luôn cả toggle **"Silence notifications"**: tắt thông báo toàn máy cần quyền
  `ACCESS_NOTIFICATION_POLICY` (Android DND), Expo managed không expose. Còn lại 3 toggle,
  cả 3 đều nối vào hành vi thật.
- **Thêm** ô chọn ngôn ngữ (vi/en) — design không có, nhưng CLAUDE.md bắt buộc i18n 2 thứ
  tiếng nên phải có chỗ đổi, nếu không nửa bản `en` là code chết.
