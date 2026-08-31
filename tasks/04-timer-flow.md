# 04 — Luồng timer (route `/`)

`app/index.tsx` render theo state: Onboarding | Timer | Break | Done — cùng một đồng hồ.

- [x] `OnboardingScreen` — kicker Interval, accent rule, "Twenty-five minutes. Then five.",
      nút Begin, meta row 25/5/15 · 4 per set
- [x] `TimerScreen` — "Session N of 4", chrome Queue/Record/Set, ring 264 + radial glow,
      clock, stateLabel, task name/meta, primary Start|Pause|Resume, secondary
      End session early|Change task
- [x] `BreakScreen` — gradient accent-900 → bg, ring 236, copy, nút Skip break
- [x] `DoneScreen` — accent rule, "Session logged.", stat grid 2x2, Take the break, End set
- [x] **Long break**: onboarding hứa `25 / 5 / 15 · 4 per set` → sau session thứ 4 dùng
      long break 15'. Design chưa vẽ màn riêng (nằm ở "Try next") → tái dùng BreakScreen
      với thời lượng + copy long break.
- [x] Haptics khi start/pause/skip
- [x] Edge-to-edge: footer CTA cộng `useSafeAreaInsets().bottom`

## Sửa sau khi xem trên máy thật
- [x] **Thiếu `insets.top` ở cả 7 màn.** Trước chỉ cộng `insets.bottom`. Khung
      `AndroidDevice` trong design tự vẽ thanh trạng thái *phía trên* vùng nội dung, nên
      `padding-top: 16px` của artboard là tính từ dưới thanh đó; app thật chạy edge-to-edge
      (Android SDK 54+) thì nội dung vẽ *xuyên dưới* thanh trạng thái → phần đầu bị sát mép.
      Nay dùng `spacing.lg + insets.top` (Onboarding: `56 + insets.top`).
- [x] `BreakScreen` phải tách `root` (không padding) / `content` (có padding): trong Yoga,
      padding của cha đẩy cả con `position: absolute`, để padding ở root thì nền chuyển màu
      tụt xuống, hở một vệt nền phẳng ở đỉnh màn.
