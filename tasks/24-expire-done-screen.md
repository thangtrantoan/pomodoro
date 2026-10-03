# 24 — Màn tổng kết phiên có hạn sử dụng

`status: 'completed'` (màn Done — "Đã ghi phiên." + 4 ô thống kê) được persist xuống
AsyncStorage nhưng không có hạn. Tắt app rồi mở lại — kể cả hôm sau — vẫn thấy tổng kết của
phiên cũ, phải bấm qua `Nghỉ` hoặc `Kết thúc set` mới tới được nút `Bắt đầu`. Sang ngày mới
thì càng vô nghĩa: ô "Phiên hôm nay" đã về 0.

Màn Done là **một nhịp chờ** giữa phiên vừa xong và phiên nghỉ, không phải một trạng thái
để nhớ qua đêm.

## Quy tắc

- Quá `30 phút` kể từ lúc phiên kết thúc, hoặc đã sang ngày mới (giờ địa phương) → về
  trạng thái sẵn sàng, hiện luôn nút `Bắt đầu`.
- 30 phút vì nó dài hơn phiên nghỉ dài nhất (15') — đi nghỉ xong mở app lại vẫn thấy màn
  Done còn nguyên, không bị cướp mất nút `Nghỉ`.
- Còn trong ngày: phiên nghỉ không ai bấm tính như đã nghỉ xong → sang phiên kế tiếp
  (`skipBreak`). Sang ngày mới: set hôm qua đã đóng → về phiên 1 (`endSet`).
- Chỉ rà lại **lúc mở app và lúc quay lại foreground** (`sync()`): màn Done không có đồng hồ
  nào chạy, nên màn đang xem không bao giờ bị giật đi dưới mắt user.
- Bản đã cài từ trước không có mốc `completedAt` → coi như đã quá hạn.

## Checklist

- [x] `store/timerStore.ts`: thêm `completedAt` (persist) + action `expireDone()`, gọi từ `sync()`
- [x] `__tests__/timerStore.test.ts`: còn hạn thì giữ, quá hạn thì sang phiên kế, qua ngày
      mới thì về phiên 1, state cũ thiếu mốc thì hết hạn ngay
- [x] `npm run typecheck`, `npm test`, `npm run lint`
