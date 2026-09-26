# 22 — Một nguồn âm thanh trong phiên

## Vấn đề

Nhạc nền và tiếng tick là hai hệ song song, chồng nhau ở mọi lớp:

- **Nghe**: cả hai phát cùng lúc trong phiên focus — quá nhiều tiếng
- **Settings**: hai mục riêng, mỗi mục một danh sách chọn + một thanh âm lượng
- **Code**: hai player (`useBackgroundMusic`, `useTickingSound`), hai bộ quy tắc
  (`useMusicActive`, `useTickActive`), hai listener `playbackStatusUpdate` cùng gọi `sync()`,
  và cả một quy tắc trọng tài `useTickOwnsLockScreen` chỉ để quyết định player nào được giữ
  foreground service — vì hai MediaSession của cùng một app thì cái sau release cái trước

## Hướng

Chọn **một** nguồn: `Tắt` / một bản nhạc / một tiếng tick. Không có tổ hợp.

Vì chỉ còn một nguồn nên toàn bộ tầng trọng tài biến mất: một player, một chủ màn khoá,
một listener, một thanh âm lượng, một mục Settings.

## Checklist

- [x] `types/index.ts`: `SoundKind`, `SoundChoice`
- [x] `store/audioStore.ts`: `sound: SoundChoice | null` + `volume` + `tickInBreak`.
      `version: 1` + `migrate` từ state cũ (`enabled`/`trackId`/`tickId`/`tickVolume`) —
      bản đã cài không được mất bản nhạc đang chọn. Export `VOLUME_STEPS`.
- [x] `hooks/useSoundActive.ts` (mới): `soundSource`, `soundPlayable`, `useSoundActive`,
      `soundActiveNow` — thay `useMusicActive` + `useTickActive`
- [x] `hooks/useSessionSound.ts` (mới): một player duy nhất — thay `useBackgroundMusic` +
      `useTickingSound`
- [x] Xoá `hooks/useMusicActive.ts`, `hooks/useTickActive.ts`,
      `hooks/useBackgroundMusic.ts`, `hooks/useTickingSound.ts`
- [x] `app/_layout.tsx`: gắn một hook
- [x] `hooks/useNotificationSync.ts`: `useSoundActive()` thay hai nhánh cũ
- [x] `app/settings.tsx`: một mục `Âm thanh trong phiên` — danh sách gộp nhạc + tick,
      một âm lượng, công tắc `Tick cả trong giờ nghỉ` chỉ hiện khi chọn tick
- [x] `constants/i18n.ts`: gộp `music.*` + `tick.*` thành `sound.*`; một hint cho công tắc
      đồng hồ màn khoá thay vì hai
- [x] `app/licenses.tsx`: đổi sang `t.sound.credits*`
- [x] `__tests__/soundActive.test.ts` thay `__tests__/musicActive.test.ts`; cập nhật
      `ticks.test.ts` (nhãn dời sang `sound.tickNames`); thêm test cho `migrate`
- [x] `npm run typecheck`, `npm test`, `npm run lint`
