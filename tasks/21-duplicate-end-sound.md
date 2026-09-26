# 21 — Hai tiếng báo hết phiên đè nhau

## Triệu chứng

Mỗi mốc chuyển phiên (rõ nhất ở lúc hết giờ nghỉ rồi vào phiên mới) nghe **hai** tiếng báo
lệch nhau một nhịp, không phải một.

## Nguyên nhân

App có hai tiếng báo hết phiên, cố ý — nhưng chưa ai chọn một trong hai:

1. `chime.wav` phát từ trong app (`hooks/useSessionChime.ts`) — chắc chắn kêu khi app mở,
   không phụ thuộc quyền thông báo hay độ chính xác của alarm
2. Tiếng của notification hệ thống — `scheduleSessionEnd` truyền `sound: chime`

`cancelSessionEnd()` **cố ý không huỷ** lịch khi đã qua mốc hẹn (`utils/notifications.ts`):
huỷ vô điều kiện là app tự gỡ mất đúng thông báo nó vừa hẹn, vì tick 500ms của
`useCountdown` luôn phát hiện hết giờ trước khi hệ điều hành kịp bắn alarm. Quyết định đó
đúng, nhưng hệ quả chưa xử: app đang mở thì alarm vẫn bắn và kêu thêm một tiếng nữa, lệch
với `chime.wav` đúng bằng độ trễ của alarm.

Handler thì trả `shouldPlaySound: true` vô điều kiện, nên không có gì chặn.

## Cách sửa

Chọn một theo trạng thái app, trong `configureNotificationHandler`:

- `AppState.currentState === 'active'` → `shouldPlaySound: false`. Chuông trong app là
  tiếng chính; banner vẫn hiện vì nó nói phiên nào vừa xong.
- Ngoài foreground → `shouldPlaySound: true`. Màn hình tắt là JS timer đã bị gỡ, chuông
  trong app không có gì kích hoạt, notification là tiếng duy nhất còn lại.

Không gộp `'inactive'` của iOS vào foreground: đó là trạng thái quá độ, không chắc chuông
trong app kịp kêu — thà nghe thừa một tiếng còn hơn im hẳn ở mốc hết phiên.

Cờ `chime` tắt thì cả hai vẫn im như trước, `scheduleSessionEnd` đã truyền `sound: false`.

## Checklist

- [x] `utils/notifications.ts`: `shouldPlaySound` theo `AppState.currentState`
- [x] `__tests__/notifications.test.ts`: test foreground im / background kêu / banner luôn hiện
- [x] `npm run typecheck`, `npm test` (67 pass), `npm run lint`
