# 15 — Công tắc "Đồng hồ trên màn khóa" trông như hỏng

## Bối cảnh

User thử gạt công tắc trên máy thật, không thấy gì đổi. Không phải bug — công tắc **im
lặng vô hiệu** trong hai trường hợp mà không nói gì:

1. **Đang bật nhạc nền.** `useNotificationSync` cố ý ẩn đồng hồ thường trực để không có
   hai notification của cùng một app chồng nhau (quyết định ở task 12). Media notification
   của trình phát mới là thứ user đang nhìn — và nó không thuộc quyền công tắc nào cả, vì
   foreground service của Android bắt buộc phải có notification.
2. **Đang chạy iOS/web.** `showOngoing` return ngay ở dòng đầu.

Cả hai lần user đều gạt rồi tưởng app hỏng.

## Checklist

- [x] `hooks/useMusicActive.ts` — tách `musicPlayable(enabled, trackId)` ra khỏi
      `isActive`. Settings cần phần cấu hình (bỏ điều kiện phiên đang chạy) vì lúc đứng ở
      Settings chưa có phiên nào chạy. Giữ một định nghĩa duy nhất, không viết lại luật.
- [x] `components/ui/Toggle.tsx` — thêm prop `disabled`: làm mờ hàng, chặn bấm,
      `accessibilityState.disabled`
- [x] `constants/i18n.ts` — `settings.ongoingHintMusic` (vi + en)
- [x] `app/settings.tsx` — nhạc nền bật thì công tắc mờ + hint đổi thành lý do; iOS/web thì
      ẩn hẳn hàng
- [x] `__tests__/musicActive.test.ts` — 2 test cho `musicPlayable`
- [x] `npm run typecheck` pass
- [ ] `npm run lint` + `npm test` (cần user confirm)

## Không làm

- **Không tắt media notification khi user tắt công tắc.** Nó là điều kiện sống của
  foreground service — bỏ đi là nhạc chết giữa phiên, đúng bug task 12 vừa fix.
- **Không đổi label "Đồng hồ trên màn khóa".** Chuỗi `en` lấy nguyên văn từ design; đổi
  thì phải đổi cả hai ngôn ngữ, chưa hỏi user.
