# 17 — Chế độ Basic (một công tắc gộp)

Một công tắc `basicMode` trong Settings. Bật lên thì app còn đúng: một đồng hồ, một nút.

- Không đếm phiên / không set: bỏ dòng `Phiên 1 / 4`, bỏ nghỉ dài — mọi phiên nghỉ là
  nghỉ ngắn, `sessionNo` giữ nguyên 1.
- Không có việc cần làm: ẩn nút `Việc` ở Timer, ẩn tên việc + nút `Đổi việc`, ẩn tên việc
  trong thông báo và trên màn khoá. **Không xoá** `taskStore` / route `/queue` — tắt công
  tắc là mọi thứ trở lại y như cũ, task cũ còn nguyên.

## Checklist

- [x] `types/index.ts`: thêm `'basicMode'` vào `FlagKey`
- [x] `store/settingsStore.ts`: `DEFAULT_FLAGS.basicMode = false` (mặc định giữ hành vi cũ)
- [x] `store/timerStore.ts`: `startBreak()` luôn `shortBreak` khi basic; `skipBreak()` không
      tăng `sessionNo` khi basic
- [x] `components/screens/TimerScreen.tsx`: ẩn kicker phiên, ẩn khối tên việc, bỏ nút `Việc`
      khỏi chrome, nút phụ chỉ còn `Kết thúc phiên sớm` (ẩn khi chưa chạy)
- [x] `components/screens/DoneScreen.tsx`: câu tổng kết bỏ tên việc + vị trí phiên, nút nghỉ
      luôn dùng `shortBreakMinutes`, nhãn nút phụ đổi sang "Xong hôm nay"
- [x] `components/screens/OnboardingScreen.tsx`: ẩn dòng meta `n phiên mỗi set` khi basic
- [x] `hooks/useNotificationSync.ts` + `utils/notifications.ts`: `sessionEndCopy` nhận thêm
      cờ basic → body không nhắc tên việc
- [x] `hooks/useBackgroundMusic.ts`: metadata màn khoá khi basic — không hiện `Phiên n / m`
      lẫn tên việc
- [x] `app/settings.tsx`: thêm công tắc `basicMode` (đặt đầu nhóm công tắc)
- [x] `constants/i18n.ts`: `settings.basicMode/basicModeHint`, `done.bodyBasic`, `done.endDay`,
      `timer.focusingLock`, `notification.focusDoneBodyPlain` — cả `vi` và `en`
