# 01 — Foundation: tokens, theme, i18n, types

Nguồn: Claude Design project `Interval - Pomodoro.dc.html`, design system **Nocturne**
(`_ds/nocturne-.../styles.css` + `readme.md`).

- [x] `constants/colors.ts` — port token Nocturne (ramp `accent100..900`, `neutral100..900`)
      + alias semantic theo bảng token trong CLAUDE.md
- [x] Dark-only: Nocturne là hệ dark thuần (`--color-bg #161826`), không có light theme.
      `useColors()` vẫn là accessor duy nhất để sau này thêm light không phải sửa component.
- [x] Token thêm mới (Nocturne không có): `danger`, `dangerLight`, `textGhost`
- [x] `constants/theme.ts` — `spacing`/`radius` theo CLAUDE.md; thêm `typography` (size +
      weight + letterSpacing tuyệt đối px) vì design nặng typography
- [x] Font: **không** dùng Inter (user không duyệt thêm dep) → system font + `fontWeight`
      số ('300' cho numeral lớn). Ghi chú trong theme.ts.
- [x] `constants/i18n.ts` — vi + en, copy `en` lấy nguyên văn từ design
- [x] `types/index.ts` — toàn bộ type/interface

## Sửa sau khi xem trên máy thật
- [x] **Loé trắng khi chuyển màn.** `contentStyle` của Stack đã tối nhưng expo-router vẫn
      dùng `DefaultTheme` (nền trắng) của React Navigation — đó mới là nền vẽ phía sau lúc
      transition chạy. Thêm `ThemeProvider` với theme dark map từ token Nocturne, và đặt
      `backgroundColor` cho `GestureHandlerRootView` (view cửa sổ gốc mặc định trắng).
