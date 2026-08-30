# Pomodoro — Expo App

App tập trung công việc theo kỹ thuật Pomodoro. iOS + Android + Web. Offline-first,
**không có backend**, mọi data lưu AsyncStorage.

> Project mới khởi tạo (copy tooling/config từ `personal_app`). Các quy ước dưới đây là
> convention áp dụng ngay từ đầu — `components/ui/`, `hooks/`, `store/`, `constants/`,
> `utils/`, `types/` hiện đang rỗng, tạo file đúng theo pattern khi cần.

---

## Tech Stack

| Layer | Thư viện |
|---|---|
| Framework | Expo ~54, React Native 0.81.5 |
| Routing | expo-router ~6.0 (file-based) |
| UI | react-native-paper ^5.12 (Material Design 3) |
| State | zustand ^5.0 + AsyncStorage (persist) |
| Animation | react-native-reanimated ~4.1 |
| Gesture | react-native-gesture-handler ~2.28 |
| Icons | @expo/vector-icons (MaterialIcons) |
| Notifications | expo-notifications (chỉ local — nhắc khi phiên Pomodoro/nghỉ kết thúc, không push/remote) |

---

## Cấu trúc thư mục

```
app/                      # Expo Router — mỗi file = một route
  (tabs)/
    _layout.tsx
    index.tsx              # Timer (placeholder — xây feature ở đây)
  _layout.tsx               # Root layout (Paper Provider, theme)

components/ui/             # Reusable UI — kiểm tra ở đây TRƯỚC khi tự viết
hooks/                     # Custom hooks (useColors, useT, useHydrated...)
store/                     # Zustand stores — mỗi feature 1 file
types/                     # Tất cả type/interface
constants/                 # Colors, theme tokens, i18n, categories
utils/                     # Helpers (date, formatting...)
```

---

## Theme & Colors

- Dùng hook `useColors()` để lấy màu — **KHÔNG BAO GIỜ hardcode màu hex, rgba, hay tên màu** (`#fff`, `white`, `#FFFFFF`, `rgba(0,0,0,0.5)`).
- Không có token phù hợp → **thêm vào `constants/colors.ts` trước**, không hardcode inline.
- Token hay dùng:
  - Text trên nền primary: `c.onPrimary`, `c.onPrimaryMuted`, `c.onPrimaryFaint`
  - Hành động xoá / nguy hiểm: `c.danger`, `c.dangerLight`

---

## Styles

Luôn dùng pattern `makeStyles` + `useMemo`:

```ts
function makeStyles(c: AppColors) {
  return StyleSheet.create({ ... });
}
// trong component:
const styles = useMemo(() => makeStyles(colors), [colors]);
```

- Không dùng inline style cho màu/spacing — chỉ `StyleSheet.create` qua `makeStyles`.
- Spacing/radius dùng từ `constants/theme.ts`: `spacing.md`, `radius.lg`...
- Inline style `{{ flex: 1 }}`, `{{ gap: 8 }}` cho layout structural là ok.

---

## i18n

- Mọi chuỗi hiển thị UI lấy từ `useT()` — không hardcode string tiếng Việt hay tiếng Anh.
- Thêm chuỗi mới → thêm vào CẢ `vi` và `en` trong `constants/i18n.ts`.

---

## State Management

- Mỗi feature = 1 Zustand store riêng trong `store/`.
- Persist toàn bộ state xuống AsyncStorage (offline-first).
- Không dùng Redux, Context API, hay global setState.
- Dùng `useHydrated()` khi cần đợi store load xong trước khi render.
- **Subscribe bằng selector từng field**: `useStore((s) => s.field)` — KHÔNG destructure cả store (`const { a, b } = useStore()`). Actions của Zustand là stable reference nên select riêng từng cái vẫn an toàn.

---

## UI Components

- Ưu tiên dùng react-native-paper trước khi tự build.
- **Kiểm tra `components/ui/` TRƯỚC KHI viết component mới** — pattern chuẩn (theo `personal_app`, copy nguyên bản nếu cần):
  - Nút hành động (Save/Delete/Edit/Confirm...) → `Button` riêng (`variant: primary | secondary | danger`) — KHÔNG dùng `Button` của react-native-paper cho các nút này
  - Popup/bottom-sheet → `AnimatedSheet` (base cho mọi popup)
  - Popup xác nhận → `ConfirmSheet` (xoá → wrapper `ConfirmDeleteSheet`)
  - Popup nhập text → `PromptSheet`
  - Toggle phân đoạn → `SegmentedControl<T>`
- **KHÔNG dùng `Dialog` của react-native-paper trực tiếp** — mọi popup qua `AnimatedSheet`.
- **KHÔNG dùng `Alert.alert` để xác nhận hành động** — dùng `ConfirmSheet`/`ConfirmDeleteSheet`.
- **Thông báo kết quả (success/error) → `Snackbar` của Paper**.
- **List dài render từ data → `FlatList`**, không `.map` trong ScrollView.
- Pattern JSX xuất hiện ≥ 2 nơi → tạo component trong `components/ui/` trước rồi mới dùng.
- Haptic feedback: `expo-haptics` cho gestures quan trọng (vd: khi bấm start/pause/skip session).
- **CTA quan trọng KHÔNG đặt cuối nội dung ScrollView** (màn nhỏ sẽ không thấy) — ghim footer cố định ngoài vùng cuộn.

---

## TypeScript

- Strict mode. Không dùng `any`.
- Mọi type/interface định nghĩa trong `types/index.ts`.

---

## Design Tokens (tham chiếu nhanh)

| Nhóm | Token |
|---|---|
| Brand | `primary`, `primaryLight`, `accent`, `accentLight`, `onAccent` |
| On-primary | `onPrimary`, `onPrimaryMuted`, `onPrimaryFaint`, `onPrimaryOverlay`, `onPrimaryOverlayBorder` |
| Background | `background`, `surface`, `surfaceVariant` |
| Text | `text`, `textSecondary`, `textMuted`, `textFaint` |
| UI | `border`, `borderStrong`, `backdrop`, `danger`, `dangerLight` |
| Stat bars | `statBarBg`, `statBarFill`, `statBarSubdued` (vd: vòng/thanh tiến trình session) |

**Spacing:** `xs=4 · sm=8 · md=12 · lg=16 · xl=24 · xxl=32`

**Radius:** `sm=8 · md=12 · lg=16 · xl=20 · full=999`

---

## Lưu ý

- **No backend**: Không có API, không có server. KHÔNG tạo fetch/axios call.
- **Reanimated**: Babel plugin `react-native-reanimated/plugin` phải là plugin **cuối cùng** trong `babel.config.js`.
- **Edge-to-edge (Android, SDK 54+)**: thanh điều hướng hệ thống vẽ đè lên app. Mọi bar/footer ghim đáy màn hình phải cộng `useSafeAreaInsets().bottom` hoặc nằm trong `SafeAreaView`.
- **expo-notifications**: chỉ dùng local notification (nhắc khi hết phiên tập trung/nghỉ) — không push/remote.

---

## Workflow task

- Trước khi làm một tính năng: tách thành các task nhỏ, tạo task file `tasks/<số>-<slug>.md`
  với checklist `- [ ]`; làm xong mục nào tick `- [x]`.
- **Ưu tiên task tính năng trước.** Các tác vụ verify tốn token (lint, format, test) gom thành
  MỘT task cuối cùng — không chạy xen kẽ sau từng thay đổi nhỏ.
- Log tiến trình todo tự ghi vào `.claude/logs/task-log.md` (hook TodoWrite) — không tự sửa file này.

---

## Verification

Trước khi báo hoàn thành một tính năng, cả ba lệnh dưới phải pass. Riêng lint / format / test
là hoạt động tốn token: **chỉ chạy ở cuối batch tính năng và phải được user confirm** (permission
rule `ask` trong `.claude/settings.json` sẽ hỏi — không tự bypass). `typecheck` rẻ, chạy tự do.

```bash
npm run typecheck   # tsc --noEmit — chạy tự do sau mỗi thay đổi
npm run lint        # expo lint (ESLint 9 flat config + Prettier) — 0 error (warning exhaustive-deps chấp nhận được) — cần confirm
npm test            # jest — cần confirm
```

Lưu ý: `expo lint` cache kết quả ở `.expo/cache/eslint` và **không invalidate khi đổi config** (eslint.config.js, .prettierrc) — đổi config xong phải xoá thư mục cache này rồi mới lint lại.

Format tự động: `npm run format` (Prettier — printWidth 100, singleQuote, endOfLine auto). Markdown, app.json, package-lock.json nằm trong `.prettierignore`, không format.

---

## Không được tự ý

- Không tạo dependency mới khi chưa hỏi.
- Không refactor code không liên quan đến task hiện tại.
- Không đổi config files (babel, tsconfig, app.json) khi chưa hỏi.
- Không tạo component mới nếu đã có component tương tự trong `components/ui/`.
