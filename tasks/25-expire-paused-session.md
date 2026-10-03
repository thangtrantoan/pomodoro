# 25 — Phiên tạm dừng có hạn, và màn tổng kết tính theo mốc kết thúc thật

Tiếp [24](24-expire-done-screen.md). Hai chỗ còn lại cùng một bệnh: trạng thái được persist
nhưng không ai hỏi "cái này cũ từ bao giờ".

1. **Phiên tạm dừng.** Pause giữa phiên rồi tắt app, ba ngày sau mở lại vẫn thấy `12:34` với
   nút `Tiếp tục` của phiên hôm đó.
2. **Màn tổng kết sinh ra đã quá hạn.** Hạn ở task 24 đo từ `completedAt`, mà `completedAt`
   lúc đó lấy `Date.now()`. Phiên hết giờ trong lúc app đang ngủ thì `sync()` ghi nhận lúc
   user **mở app lại** — nên màn tổng kết luôn "vừa mới sinh ra" và hạn không bao giờ tới.
   Đây mới là đường user hay gặp: chạy phiên → tắt app → hôm sau mở lại.

## Quy tắc

### Phiên tạm dừng (`expirePaused`)

- **Chỉ sang ngày mới** mới coi là đã bỏ. Còn trong ngày thì tạm dừng bao lâu cũng là quyền
  của user — đi họp hai tiếng về bấm `Tiếp tục` là chuyện bình thường. Không áp hạn 30 phút
  như màn tổng kết: ở đây cái bị mất là phiên đang làm dở, không phải một màn thông báo.
- Phần đã ngồi được **ghi lại thành một phiên gián đoạn**, với `endedAt` là mốc bấm tạm dừng
  — công của hôm qua phải nằm ở hôm qua, không nhảy sang ngày mở app lại.
- Dưới `1 phút` thì không ghi: bấm `Bắt đầu` rồi `Tạm dừng` ngay không phải một phiên, ghi
  vào chỉ làm bẩn tỉ lệ hoàn thành và cột "Lần gián đoạn".
- Phiên **nghỉ** treo qua đêm: cũng về phiên focus sẵn sàng, nhưng không ghi gì (nghỉ không
  vào log).
- Bản đã cài từ trước chưa có `pausedAt` → suy từ `startedAt` (chỉ cần đúng *ngày*). Không
  có cả hai thì **để yên**: một phiên đang treo là thứ user chủ ý tạo ra, không tự tay bỏ
  khi còn mơ hồ. Khác với màn tổng kết — bỏ cái đó thì không mất gì.

### Mốc kết thúc thật

- `completedAt` lấy `endAt` (mốc hết giờ), không lấy `Date.now()`.
- `logFocusSession` nhận thêm tham số `endedAt` thay vì tự lấy `Date.now()`: mọi số liệu ở
  màn Record chia theo ngày của `endedAt`, nên phiên kết thúc 22:00 hôm qua mà ghi "bây giờ"
  là đẩy công hôm qua vào "Tập trung hôm nay".
- Phiên hết giờ lúc app ngủ quá lâu thì gọi `expireDone()` **ngay trong nhánh đó** của
  `sync()`, không đợi nhịp `sync()` kế tiếp — đợi thì màn tổng kết kịp loé lên một frame.

## Checklist

- [x] `store/timerStore.ts`: `pausedAt` (persist) + `expirePaused()`, gọi từ `sync()`
- [x] `store/timerStore.ts`: `completedAt` lấy `endAt`, `logFocusSession` nhận `endedAt`,
      gọi `expireDone()` ngay trong nhánh hết phiên focus
- [x] `__tests__/timerStore.test.ts`: cùng ngày thì giữ, qua đêm thì bỏ + ghi log đúng ngày,
      dưới 1 phút không ghi, phiên nghỉ không ghi, bản cũ suy từ `startedAt`, không mốc nào
      thì để yên
- [x] `npm run typecheck`, `npm test`, `npm run lint`
