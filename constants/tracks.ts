import type { Track } from '../types';

/**
 * Nhạc nền đi kèm app. **Hiện đang rỗng** — file nhạc phải do bạn cung cấp
 * (xem `assets/audio/README.md`).
 *
 * ## Thêm một track
 *
 * 1. Bỏ file `.mp3` vào `assets/audio/`
 * 2. Thêm một dòng vào `TRACK_SOURCES` — Metro cần `require()` tĩnh, không nhận đường
 *    dẫn ghép chuỗi lúc chạy
 * 3. Thêm một entry vào `TRACKS`, đủ thông tin giấy phép
 *
 * ```ts
 * const TRACK_SOURCES = {
 *   'rain-piano': require('../assets/audio/rain-piano.mp3'),
 * } satisfies Record<string, number>;
 *
 * export const TRACKS: ManifestTrack[] = [
 *   {
 *     id: 'rain-piano',
 *     source: 'rain-piano',   // gõ sai key ở đây là TypeScript báo đỏ ngay
 *     title: 'Rain Piano',
 *     artist: 'Kevin MacLeod',
 *     license: 'CC BY 4.0',
 *     sourceUrl: 'https://incompetech.com/music/royalty-free/...',
 *     attribution:
 *       '"Rain Piano" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0',
 *     clearedForAppEmbedding: true,
 *   },
 * ];
 * ```
 *
 * ## Trước khi bật `clearedForAppEmbedding: true`
 *
 * Phải tự kiểm giấy phép có cho phép **nhúng và phát hành kèm trong một app** hay không.
 * Rất nhiều giấy phép "royalty-free" chỉ cấp quyền sync cho video; redistribute file
 * audio bên trong binary của app là một quyền khác.
 *
 * Cụ thể đã tra (2026-08):
 * - **Pixabay** — tránh. Content License cấm phân phối nội dung ở dạng "Standalone",
 *   định nghĩa là "no creative effort has been applied … remains in substantially the
 *   same form". File mp3 nguyên bản nằm trong APK/IPA và giải nén ra được rơi đúng vào đó.
 * - **Freesound lọc CC0** — sạch nhất, không cần credit (`attribution: null`).
 *   Phải lọc đúng CC0; CC-BY-NC là cấm thương mại, dùng không được.
 * - **Incompetech (Kevin MacLeod)** — CC BY 4.0, cho thương mại, FAQ nói rõ dùng trong
 *   game kèm màn Credits là được. Bắt buộc credit đúng nguyên văn → điền `attribution`.
 * - **Free Music Archive** — giấy phép do người upload chọn, phải kiểm từng bài.
 *
 * Mọi track khai ở đây tự động hiện ở màn credit `app/licenses.tsx`.
 */
const TRACK_SOURCES = {
  'study-lofi': require('../assets/audio/alex-morgan-study-lofi-music-548638.mp3'),
} satisfies Record<string, number>;

/**
 * Key hợp lệ của `TRACK_SOURCES`. Manifest rỗng thì đây là `never` — đúng, vì chưa có
 * file nào để trỏ tới. Thêm một dòng vào `TRACK_SOURCES` là kiểu này tự nới ra.
 */
type SourceKey = keyof typeof TRACK_SOURCES;

/**
 * `Track` nhưng `source` bị buộc về đúng key của `TRACK_SOURCES`.
 *
 * Trước đây `source` là `string` tự do nên gõ sai vẫn compile xanh, tới lúc chạy mới im
 * lặng không phát — ngược hẳn với việc bắt giấy phép ở compile-time ngay bên cạnh.
 */
export type ManifestTrack = Omit<Track, 'source'> & { source: SourceKey };

export const TRACKS: ManifestTrack[] = [
  {
    id: 'study-lofi',
    source: 'study-lofi',
    title: 'Study Lofi Music',
    artist: 'Alex Morgan',
    license: 'Pixabay Content License',
    sourceUrl: 'https://pixabay.com/users/alex-morgan-54692529/',
    // Pixabay không bắt buộc ghi credit, nhưng vẫn ghi — vừa là phép lịch sự với tác giả,
    // vừa để lại dấu vết nguồn gốc ngay trong app. Chép từ đoạn credit Pixabay sinh ra,
    // bỏ thẻ <a> vì màn credit render bằng <Text> chứ không parse HTML.
    attribution: 'Music by Alex Morgan from Pixabay',
    clearedForAppEmbedding: true,
  },
];

/** Tra ngược bằng string — `TRACKS` đã được kiểm kiểu nên nhánh `null` chỉ là phòng thủ */
const SOURCE_LOOKUP: Record<string, number> = TRACK_SOURCES;

/** Asset đã `require()` của một track, `null` nếu không tìm thấy */
export function trackSource(track: Track): number | null {
  return SOURCE_LOOKUP[track.source] ?? null;
}

export function findTrack(id: string | null): Track | null {
  if (id === null) return null;
  return TRACKS.find((t) => t.id === id) ?? null;
}

/** Các track đòi ghi credit — màn credit chỉ render nhóm này */
export function tracksNeedingAttribution(): Track[] {
  return TRACKS.filter((t) => t.attribution !== null);
}
