# 14 — Tự bắt đầu phiên nghỉ (cờ `autoBreak`)

`autoStart` mới chỉ lo một chiều: hết giờ nghỉ → tự vào phiên tập trung. Chiều còn lại
(hết phiên tập trung → nghỉ) vẫn phải bấm ở màn Done. Thêm cờ **riêng** `autoBreak` để
bật/tắt độc lập — ai muốn xem màn tổng kết thì để tắt.

Mặc định `autoBreak: false` — giữ nguyên hành vi hiện tại cho máy đã cài.

- [x] `types/index.ts` — thêm `'autoBreak'` vào `FlagKey`
- [x] `store/settingsStore.ts` — `DEFAULT_FLAGS.autoBreak = false`; thêm `merge` cho persist
      (merge nông của zustand thay nguyên `flags`, cờ mới sẽ `undefined` với bản cài cũ)
- [x] `store/timerStore.ts` — `sync()` nhánh focus hết giờ: bật cờ thì `startBreak()` luôn
- [x] `constants/i18n.ts` — `settings.autoBreak` + `autoBreakHint` (vi + en)
- [x] `app/settings.tsx` — thêm dòng toggle ngay dưới `autoStart`
- [x] `__tests__/timerStore.test.ts` — thêm `autoBreak` vào fixture flags + test hành vi mới
- [x] `npm run typecheck` pass
- [ ] `npm run lint` + `npm test` (cần user confirm)

## Ghi chú

- `endEarly()` **không** tự vào nghỉ: kết thúc sớm là quyết định có chủ đích, vẫn dừng ở
  màn Done để user tự chọn.
- Ghi log phiên + `endedTick` (tín hiệu chuông) vẫn chạy như cũ trước khi vào nghỉ, nên
  bỏ qua màn Done không mất số liệu.
