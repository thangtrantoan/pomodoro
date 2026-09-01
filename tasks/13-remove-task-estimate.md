# 13 — Bỏ tính năng ước lượng pomodoro cho task

Trường `Task.estimate` chưa bao giờ có UI để nhập (chỗ gọi duy nhất là
`addTask(name)` ở `app/queue.tsx`), nên mọi task luôn hiện "chưa ước lượng".
Bỏ hẳn trường này thay vì dựng thêm UI nhập.

- [x] `types/index.ts` — xoá field `estimate` khỏi `Task`
- [x] `store/taskStore.ts` — `addTask(name)` bỏ tham số `estimate`
- [x] `constants/i18n.ts` — bỏ `timer.estimated`, `timer.noEstimate`, `queue.count`;
      thêm `timer.sessionsDone(n)` (vi + en)
- [x] `components/screens/TimerScreen.tsx` — meta dưới tên việc đổi sang số phiên đã xong
- [x] `app/queue.tsx` — bỏ meta ước lượng ở mỗi dòng (chỉ còn tên + số phiên);
      subtitle sheet xoá dùng `sessionsDone`
- [x] `components/ui/TaskRow.tsx` — `meta` thành optional
- [x] `__tests__/timerStore.test.ts` — bỏ `estimate` khỏi fixture task
- [x] Việc chưa chạy phiên nào -> ẩn hẳn dòng meta (Timer) và subtitle sheet xoá,
      chỉ hiện khi `completed > 0`
- [x] `npm run typecheck` pass
- [ ] `npm run lint` + `npm test` (gom vào batch verify cuối, cần user confirm)

## Ghi chú

Task cũ trong AsyncStorage vẫn còn key `estimate` thừa trong JSON đã persist —
vô hại, zustand chỉ đọc các field còn khai trong type. Không cần migrate.
