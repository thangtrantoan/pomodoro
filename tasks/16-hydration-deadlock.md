# 16 — App đứng màn đen ở cổng hydrate

## Bối cảnh

Bản build cài trên máy thật mở lên chỉ có nền `#161826`, không crash, không báo gì. Chạy
qua QR trên máy ảo thì bình thường.

Đọc ngược từ ảnh chụp màn hình:

- Đo pixel ảnh chụp: `#161825` đều khắp màn hình — đúng `nocturneColors.background`
  (`#161826`) sau nén JPEG. Nền cửa sổ hệ thống không ra màu đó. Cộng với status bar sáng
  của `<StatusBar style="light" />` → **`RootLayout` đã render và commit**. Không phải lỗi
  không tìm thấy bundle, cũng không phải crash trước khi JS chạy.
- Lưu ý: **không** suy ra được "không có exception" từ việc thiếu chữ "Something went wrong".
  expo-router chỉ bọc `Try` khi route có export `ErrorBoundary`
  (`node_modules/expo-router/build/useScreens.js:133`), mà project này không export cái nào.

Hai khả năng còn lại:

- **(A)** `useStoresHydrated()` trả `false` vĩnh viễn → app kẹt ở nhánh placeholder của
  `app/_layout.tsx`. Đây là nghi phạm chính.
- **(B)** `AppShell` render được nhưng route bên trong không vẽ ra gì. Ít khả năng hơn:
  một throw lúc render route sẽ gỡ cả cây (không có error boundary nào) và để lộ nền cửa
  sổ trắng, chứ không giữ được `#161826`.

Trong zustand đã cài có **hai đường dẫn tới đó, cả hai đều hoàn toàn im lặng**:

1. `createJSONStorage(getStorage)` — `getStorage()` throw thì hàm `return` trơn
   (`middleware.mjs`, nhánh `catch (e) { return; }`). `options.storage` thành `undefined`,
   `hydrate()` gặp `if (!storage) return;` và thoát ngay. `hasHydrated` ở lại `false`,
   không listener nào bắn, **không log một dòng nào**.
2. Chuỗi promise của `hydrate()` reject — `getItem` lỗi, JSON hỏng, hoặc callback
   `onRehydrateStorage` throw. Nhánh `.catch` chỉ gọi lại `postRehydrationCallback(void 0, e)`;
   `hasHydrated = true` và `finishHydrationListeners.forEach(...)` nằm ở `.then` phía
   trên nên **không bao giờ chạy**.

`hooks/useHydrated.ts` đợi cả 5 store bằng `every(...)` và không có timeout → một store
chết là màn đen vĩnh viễn.

## Nguyên nhân gốc (đã reproduce)

`store/settingsStore.ts`, `merge` — thêm ở đúng commit 1ebc943 làm hỏng build:

```ts
merge: (persisted, current) => {
  const saved = persisted as Partial<SettingsState>;   // persisted === undefined
  return { ...current, ...saved, flags: { ...DEFAULT_FLAGS, ...(saved.flags ?? {}) } };
}                                                       //         ^ TypeError
```

zustand **vẫn gọi `merge` khi trong máy chưa có gì**: `hydrate()` trả `[false, void 0]`
rồi đưa thẳng `undefined` vào `merge`. `saved.flags` ném TypeError → rơi vào `.catch` →
`hasHydrated()` của settingsStore ở lại `false` vĩnh viễn.

Khớp hết mọi triệu chứng:

- **Máy thật, APK mới cài** — `settings-storage` chưa tồn tại → throw → màn đen.
- **Máy ảo chạy QR** — đã chạy app từ trước nên `settings-storage` có sẵn, `persisted` là
  object → không throw → chạy ngon. Đây là lý do bug này lọt qua được cả quá trình dev.
- **Sau khi thêm timeout, vẫn đen đủ 3s mỗi lần mở** — user chưa đổi setting nào nên
  `settings-storage` không bao giờ được ghi, lần mở nào cũng vấp lại đúng chỗ đó.

Kiểu không bắt được: `persisted` là `unknown`, ép `as Partial<SettingsState>` (không có
`| undefined`) làm `saved.flags` compile xanh.

## Checklist

- [x] `store/settingsStore.ts` — `persisted ?? {}` trong `merge`
- [x] `__tests__/hydration.test.ts` — hydrate với AsyncStorage rỗng. Đã kiểm ngược: bỏ
      `?? {}` ra thì test đỏ
- [x] `hooks/useHydrated.ts` — timeout thoát cổng hydrate; log tên store còn kẹt. Giữ lại
      làm lưới an toàn: không có nó thì một lỗi hydrate bất kỳ lại thành màn đen câm
- [x] `store/timerStore.ts` — bọc `sync()` trong `onRehydrateStorage` bằng try/catch
- [x] `npm run typecheck`
