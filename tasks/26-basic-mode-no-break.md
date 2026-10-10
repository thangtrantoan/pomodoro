# 26 — Basic mode: bỏ hẳn phiên nghỉ

Task 17 chỉ bỏ *nghỉ dài* trong basic mode, nghỉ ngắn vẫn còn: màn Done mời "Nghỉ 5 phút",
thông báo hết phiên nói "Nghỉ một chút.", và bật `autoBreak` thì vào nghỉ luôn.

Hành vi đúng: basic mode hết phiên là **Done, hết**. Muốn chạy phiên mới thì user tự bấm
Bắt đầu — không có phiên nghỉ, không có gì tự chạy.

Kéo theo: `autoStart` (chỉ chạy ở mốc hết nghỉ) và `tickInBreak` (tick trong giờ nghỉ) trở
thành công tắc chết trong basic mode → ẩn, không để user gạt một thứ không có tác dụng.

## Checklist

- [x] `store/timerStore.ts`: `sync()` chỉ `startBreak()` khi `autoBreak && !basicMode`
- [x] `store/timerStore.ts`: thêm `applyBasicMode()` — gạt công tắc lên giữa một phiên nghỉ
      đang chạy thì cắt phiên nghỉ đó ngay
- [x] `components/screens/DoneScreen.tsx`: basic mode → nút chính là "Phiên mới" (về đồng hồ
      ở trạng thái sẵn sàng), không phải nút nghỉ
- [x] `app/settings.tsx`: ẩn `autoStart` + `autoBreak` + `tickInBreak` khi basic; gọi
      `applyBasicMode()` sau khi gạt `basicMode`
- [x] `constants/i18n.ts` (cả `vi` và `en`): `done.newSession` mới; `settings.basicModeHint`
      nói "không nghỉ"; `notification.focusDoneBodyPlain` không nhắc nghỉ;
      `onboarding.metaLengthsBasic` chỉ còn độ dài phiên focus
- [x] `types/index.ts`: cập nhật doc comment của `basicMode`
- [x] `__tests__/timerStore.test.ts`: basic mode + `autoBreak` bật → vẫn dừng ở `completed`

## Kèm theo — mốc chuyển phiên đã trôi qua lúc app ngủ

Cùng một lỗi ở hai nhánh của `sync()`: mốc chuyển phiên đã trôi qua từ lâu vẫn được xử lý
như vừa mới tới, nên app tự dựng một phiên mới tính từ `Date.now()`.

- [x] `autoBreak`: `startBreak(endAt)` — giờ nghỉ trôi theo đồng hồ thật kể từ lúc phiên
      focus hết. Mở app sau 2 phút thì còn 3 phút nghỉ; ngủ qua cả khoảng nghỉ thì
      `startBreak()` trả `false` và rơi xuống `expireDone()`
- [x] `autoStart`: chỉ tự chạy phiên focus mới khi mốc hết nghỉ còn "ấm" (`stillWarm` —
      cùng ngày và dưới `DONE_TTL_MS`), không thì mở app sáng sau thấy phiên đã chạy sẵn
- [x] Gom định nghĩa "cùng ngày" / "còn ấm" vào `sameLocalDay()` + `stillWarm()` dùng chung
      cho `expireDone`, `expirePaused` và nhánh `autoStart`
- [x] Test cũ `'bật autoBreak thì hết phiên focus là vào nghỉ luôn'` assert `endAt = now + 5p`
      — đúng cái hành vi sai. Sửa thành `focusEnd + 5p`
