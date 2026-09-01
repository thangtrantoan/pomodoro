/**
 * Chuông báo hết phiên. `require()` phải tĩnh — Metro không nhận đường dẫn ghép chuỗi
 * lúc chạy, y hệt ràng buộc ở `constants/tracks.ts`.
 *
 * File do ffmpeg tổng hợp: sine 880Hz cộng hai bội âm 2x/3x nhỏ dần, bao hình decay
 * 1.3s, 16-bit mono 44.1kHz, đỉnh -1.0 dBFS. Giữ WAV chứ không nén sang mp3 vì chuông
 * phải kêu đúng khoảnh khắc hết giờ — PCM không mất thời gian khởi tạo decoder, và
 * 115KB cho một file là chấp nhận được.
 *
 * Tự sinh nên không có giấy phép nào phải ghi credit; màn `app/licenses.tsx` chỉ liệt
 * kê nhạc nền.
 */
export const CHIME_SOURCE: number = require('../assets/audio/chime.wav');
