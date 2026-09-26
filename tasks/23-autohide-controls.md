# 23 — Ẩn nút điều khiển khi đang chạy phiên

Đang chạy phiên thì màn đồng hồ chỉ cần con số. Hai nút ở đáy (`Tạm dừng`,
`Kết thúc phiên sớm`) không ai bấm trong 25 phút nhưng lại là hai khối sáng nhất màn hình.

Chạm vào màn hình thì hiện lại 10 giây, không chạm nữa thì ẩn tiếp.

## Quy tắc

- Chỉ ẩn khi `status === 'running'`. Tạm dừng / sẵn sàng / vừa xong thì **luôn hiện** — lúc
  đó nút `Bắt đầu` là việc duy nhất user cần làm.
- Vừa bấm `Bắt đầu` cũng tính là một lần chạm, nên hai nút còn ở lại 10 giây rồi mới mờ đi:
  ẩn ngay dưới ngón tay vừa bấm là giật cục.
- Mờ dần chứ không co chiều cao: giữ layout đứng yên, vòng tiến trình không nhảy.
- Ẩn là **không bấm được** (`pointerEvents: 'none'`) — nếu không, nút Tạm dừng vô hình sẽ
  ăn mất cú chạm để hiện lại.
- Ẩn cũng phải rời khỏi cây accessibility, không để screen reader focus vào một nút không
  bấm được.

Hàng nút trên (`Việc` / `Thống kê` / `Cài`) **không** đụng tới — chưa có yêu cầu.

## Checklist

- [x] `hooks/useAutoHide.ts` (mới) — `{ visible, reveal }`, mốc chờ 10s
- [x] `components/screens/TimerScreen.tsx`: gốc thành vùng chạm gọi `reveal`, footer mờ dần
      theo `visible` + chặn chạm + ẩn khỏi accessibility
- [x] `__tests__/autoHide.test.ts`: luôn hiện khi không chạy, ẩn sau 10s, `reveal` đặt lại
      đồng hồ chờ
- [x] `npm run typecheck`, `npm test`, `npm run lint`
