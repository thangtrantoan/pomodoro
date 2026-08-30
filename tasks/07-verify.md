# 07 — Verify (gom cuối, tốn token — cần user confirm)

- [x] `npm run typecheck`
- [x] `npm test` — unit test cho utils/time, utils/stats, timerStore
- [x] `npm run lint` (xoá `.expo/cache/eslint` trước nếu đã đổi config)
- [x] `npm run format`

## Kết quả
- `npm run typecheck` — pass
- `npm run lint` — 0 error, 0 warning
- `npm test` — 27 test / 3 suite pass
- Phải thêm `setupFiles` vào `jest.config.js`: `jest.setup.js` đã tồn tại sẵn nhưng chưa
  bao giờ được nối vào config, nên mock AsyncStorage không chạy và mọi test import store
  đều nổ `NativeModule: AsyncStorage is null`.
