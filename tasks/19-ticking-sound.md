# 19 — Tiếng tick-tock + nhóm cài đặt âm thanh

Ba tiếng tự sinh bằng ffmpeg (như `chime.wav`), chọn trong Settings.

**File phải là vòng lặp 2 giây** chứa `tick` ở 0.0s và `tock` ở 1.0s, phát bằng
`player.loop = true`. Không dùng `setInterval` mỗi giây: React Native gỡ hết JS timer khi
app xuống nền nên tiếng tick sẽ tắt ngay lúc tắt màn hình — đúng lúc cần nó nhất.

Tick giữ luôn foreground service khi **không** bật nhạc nền, để Android không đóng băng
process (xem chú thích `setActiveForLockScreen` trong `useBackgroundMusic`). Chỉ một
player được giữ màn khoá: nhạc nền phát được thì nhạc giữ, không thì tick giữ.

## Checklist

- [x] Sinh `assets/audio/tick-soft.wav`, `tick-clock.wav`, `tick-wood.wav` bằng ffmpeg
- [x] `assets/audio/README.md`: ghi lệnh sinh + thông số, nói rõ là file tự sinh nên không
      có license phải credit
- [x] `types/index.ts`: `TickId`, `TickSound`
- [x] `constants/ticks.ts`: `TICK_SOURCES` (require tĩnh) + `TICKS` + `findTick`/`tickSource`
- [x] `store/audioStore.ts`: `tickId`, `tickVolume`, `tickInBreak` + setters
- [x] `hooks/useTickActive.ts`: `tickPlayable`, `useTickActive`, `tickActiveNow`,
      `useTickOwnsLockScreen`
- [x] `hooks/useTickingSound.ts`: player loop, âm lượng, phát theo `useTickActive`, giữ màn
      khoá khi nhạc nền không phát, `sync()` theo `playbackStatusUpdate`
- [x] `app/_layout.tsx`: gắn `useTickingSound()` cạnh `useBackgroundMusic()`
- [x] `hooks/useNotificationSync.ts`: tick đang giữ màn khoá cũng chiếm chỗ đồng hồ thường
      trực → ẩn như khi có nhạc
- [x] `app/settings.tsx`: mục `Tiếng tick` — danh sách chọn (Tắt + 3 tiếng), âm lượng,
      công tắc `Phát cả trong giờ nghỉ`
- [x] `constants/i18n.ts`: nhóm `tick.*` + `tick.names` — `vi` + `en`
