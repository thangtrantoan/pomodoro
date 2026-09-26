# 20 — Verify (task cuối, gom mọi lệnh tốn token)

- [x] `npm run typecheck`
- [x] Cập nhật `__tests__/timerStore.test.ts` — object `flags` trong `beforeEach` phải đủ
      cờ mới (`basicMode`, `notify`), nếu không TypeScript báo thiếu property
- [x] Thêm test: basic mode không vào nghỉ dài, `sessionNo` không tăng
- [x] Thêm test: `constants/ticks.ts` — mọi `TICKS[].source` tra ra asset (giống `tracks.test.ts`)
- [x] `npm test` (cần user confirm)
- [x] `npm run lint` (cần user confirm)
