# assets/audio

Đặt file nhạc nền (`.mp3`) vào thư mục này, rồi khai báo trong `constants/tracks.ts`.

Type `Track` bắt buộc có đủ thông tin license — thiếu là không compile được. Đây là cố ý:
license phải được ghi lại ngay lúc thêm track, không phải "để sau".

Trước khi thêm bất kỳ file nào, kiểm tra license có cho phép **nhúng và phát hành kèm
trong một app** hay không. Nhiều license "royalty-free" chỉ cấp quyền sync cho video,
không cấp quyền redistribute trong binary của app — đó là hai quyền khác nhau.

File khai báo trong manifest sẽ tự động xuất hiện ở màn credit (`app/licenses.tsx`).

## File tự sinh — không cần license

`chime.wav` và ba file `tick-*.wav` do ffmpeg tổng hợp ngay trong repo này, không lấy từ
đâu, nên không có ai để ghi credit. Chúng **không** xuất hiện ở màn credit.

### Tiếng tick (`constants/ticks.ts`)

Mỗi file là một **vòng lặp 2 giây**: `tick` ở 0.0s, `tock` ở 1.0s, rồi im tới hết file —
phát bằng `player.loop = true` nên cả phiên chỉ cần một lần `play()`. Không dùng
`setInterval` bắn từng tiếng vì React Native gỡ sạch JS timer khi app xuống nền, tick sẽ
tắt đúng lúc user tắt màn hình để tập trung.

22.05kHz mono 16-bit, 86KB/file. Nhịp tick không có gì trên 8kHz nên 44.1kHz chỉ làm file
to gấp đôi. Giữ WAV chứ không nén mp3: padding của encoder mp3 tạo một khoảng lặng ở đầu
và cuối, mỗi vòng lặp là một lần lệch nhịp nghe rõ.

`tock` cố ý thấp và nhẹ hơn `tick` — đó là thứ làm tai nghe ra "tick TOCK" thay vì hai
tiếng giống nhau.

```bash
# 1. tick-soft — nhiễu lọc dải giữa, decay ~20ms
ffmpeg -y -f lavfi -i "aevalsrc='(random(0)*2-1)*exp(-t*170)*lt(t,0.15) + 0.72*(random(1)*2-1)*exp(-(t-1)*190)*gte(t,1)*lt(t,1.15)':d=2:s=22050:c=mono" \
  -af "highpass=f=320,lowpass=f=2400" -ac 1 -ar 22050 -c:a pcm_s16le tick-soft.wav

# 2. tick-clock — nhiễu cộng sine 2.6kHz, decay ~8ms, sắc và có kim loại
ffmpeg -y -f lavfi -i "aevalsrc='(0.62*(random(0)*2-1)+0.38*sin(2*PI*2600*t))*exp(-t*430)*lt(t,0.09) + 0.8*(0.62*(random(1)*2-1)+0.38*sin(2*PI*2050*(t-1)))*exp(-(t-1)*470)*gte(t,1)*lt(t,1.09)':d=2:s=22050:c=mono" \
  -af "highpass=f=900,lowpass=f=8000" -ac 1 -ar 22050 -c:a pcm_s16le tick-clock.wav

# 3. tick-wood — click có cao độ 900/680Hz kèm bội âm, decay ~50ms.
#    Hệ số 0.74/0.67 là để tổng hai sine không vượt 1.0 → không clip lúc ghi ra s16.
ffmpeg -y -f lavfi -i "aevalsrc='0.74*(sin(2*PI*900*t)+0.32*sin(2*PI*1830*t))*exp(-t*72)*lt(t,0.22) + 0.67*(sin(2*PI*680*(t-1))+0.32*sin(2*PI*1390*(t-1)))*exp(-(t-1)*78)*gte(t,1)*lt(t,1.22)':d=2:s=22050:c=mono" \
  -af "highpass=f=200,lowpass=f=6000" -ac 1 -ar 22050 -c:a pcm_s16le tick-wood.wav
```

Sau đó chuẩn từng file về đỉnh **-1.0 dBFS** (giống `chime.wav`) — đo bằng
`ffmpeg -i <file> -af volumedetect -f null -` rồi bù đúng phần chênh:

```bash
ffmpeg -y -i tick-soft.wav -af "volume=4.3dB" -ac 1 -ar 22050 -c:a pcm_s16le out.wav
```
