# 08 — Nhạc nền (bundled licensed music)

Design **không có** phần nhạc nền — toàn bộ UI ở đây là bổ sung, dựng theo ngôn ngữ Nocturne.

## Quyết định
- User chọn hướng **bundled licensed music** (đã được cảnh báo về rủi ro bản quyền và
  vẫn chọn — đây là quyết định của user).
- Claude **không thể tự tải file nhạc**: web tool trả về text chứ không trả binary.
  File phải do user cung cấp.

## Ràng buộc bản quyền (ghi lại để sau không quên)
- "Royalty-free" KHÔNG đồng nghĩa được nhúng vào app. Nhiều license (Epidemic, Artlist)
  chỉ cấp quyền sync cho video; phát hành kèm trong binary của app là quyền riêng, phải
  kiểm tra rõ từng license.
- CC-BY và phần lớn license thương mại **bắt buộc ghi credit hiển thị được** → có màn
  attribution sinh tự động từ manifest.
- Nguồn CC0 phải kiểm từng file: Pixabay đổi Content License năm 2024, và có nhiều file
  upload sai license.

## Việc
- [x] `types/index.ts` — type `Track` **bắt buộc** có field license (title, artist,
      license, sourceUrl). Không ghi license thì không compile được → không thể lỡ quên.
- [x] `constants/tracks.ts` — manifest, ship rỗng + hướng dẫn thêm track
- [x] `store/audioStore.ts` — bật/tắt, track đang chọn, âm lượng
- [x] `hooks/useBackgroundMusic.ts` — nối expo-audio vào timer store
- [x] Chỉ phát khi đang focus; tự dừng khi pause / hết phiên / sang giờ nghỉ
- [x] `setAudioModeAsync` — `shouldPlayInBackground`, `playsInSilentMode`,
      `interruptionMode: 'mixWithOthers'` (không cướp nhạc của app khác)
- [x] UI Settings: chọn track + âm lượng
- [x] `app/licenses.tsx` — màn credit sinh từ manifest
- [x] Empty state: chưa có track nào thì nói rõ, không hiện control chết
- [x] `expo-audio` 1.1.1 + plugin (expo install tự thêm)
- [x] `app.json`: `ios.infoPlist.UIBackgroundModes: ["audio"]`

## User cần làm
1. Bỏ file `.mp3` vào `assets/audio/`
2. Thêm entry vào `constants/tracks.ts` kèm license đầy đủ

## Nguồn nhạc đã tra (2026-08)
| Nguồn | License | Hợp với | Ghi chú |
|---|---|---|---|
| Freesound (lọc CC0) | CC0 | handpan | Sạch nhất, không cần credit → `attribution: null` |
| Incompetech | CC BY 4.0 | piano/ambient | Cho thương mại + game kèm credits; credit đúng nguyên văn |
| Free Music Archive | tuỳ track | lofi | Phải kiểm từng bài |
| ~~Pixabay~~ | — | — | **Tránh**: cấm phân phối "Standalone", mp3 nguyên bản trong APK rơi đúng vào đó |

## Kết quả
- typecheck / lint / test: xanh · 35 test / 4 suite
- `__tests__/tracks.test.ts` là bẫy đặt sẵn: manifest rỗng nên pass hiển nhiên, nhưng sẽ
  nổ ngay khi thêm track thiếu credit / gõ sai `source` / license CC-BY mà không có
  `attribution`.
