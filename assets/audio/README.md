# assets/audio

Đặt file nhạc nền (`.mp3`) vào thư mục này, rồi khai báo trong `constants/tracks.ts`.

Type `Track` bắt buộc có đủ thông tin license — thiếu là không compile được. Đây là cố ý:
license phải được ghi lại ngay lúc thêm track, không phải "để sau".

Trước khi thêm bất kỳ file nào, kiểm tra license có cho phép **nhúng và phát hành kèm
trong một app** hay không. Nhiều license "royalty-free" chỉ cấp quyền sync cho video,
không cấp quyền redistribute trong binary của app — đó là hai quyền khác nhau.

File khai báo trong manifest sẽ tự động xuất hiện ở màn credit (`app/licenses.tsx`).
