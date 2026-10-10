import type React from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type Lang = 'vi' | 'en';

/** Ba loại phiên trong một set Pomodoro */
export type Phase = 'focus' | 'shortBreak' | 'longBreak';

/**
 * `completed` = phiên focus vừa hết giờ, đang chờ user bấm sang break (màn Done).
 * Break không có trạng thái này — hết giờ là chuyển thẳng.
 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

/** 4 mức độ dài phiên focus trong Settings */
export type FocusMinutes = 15 | 25 | 45 | 50;

export const FOCUS_LENGTHS: readonly FocusMinutes[] = [15, 25, 45, 50] as const;

/**
 * Các công tắc trong Settings — mỗi cái nối vào một hành vi thật, xem utils/notifications.ts.
 *
 * `basicMode` là công tắc gộp, không phải một hành vi đơn: nó bỏ hẳn phiên nghỉ, bỏ cấu
 * trúc set (không đếm phiên, không nghỉ dài) và ẩn phần việc cần làm. Ba thứ đó đi với
 * nhau vì cùng trả lời một câu hỏi — "app này có nhiều hơn một đồng hồ hay không".
 *
 * Không còn phiên nghỉ thì `autoBreak` (mốc vào nghỉ) và `autoStart` (mốc hết nghỉ) không
 * có chỗ áp dụng — `app/settings.tsx` ẩn cả hai, và `store/timerStore.ts` không đọc tới
 * chúng nữa, vì cờ bật từ hồi còn ở chế độ đầy đủ vẫn còn nguyên trong máy.
 *
 * `notify` tắt hẳn notification hết phiên, còn `chime` chỉ quyết định phiên đó có *tiếng*
 * hay không. Tách đôi vì hai thứ chết theo hai cách khác nhau: tắt tiếng thì vẫn thấy
 * banner trên màn khoá, tắt notification là mất luôn cú đánh thức native.
 *
 * Design có thêm 1 công tắc không dựng được trong Expo managed nên đã bỏ, không làm
 * công tắc chết:
 * - "Silence notifications": muốn tắt thông báo toàn máy phải có quyền
 *   ACCESS_NOTIFICATION_POLICY (Android DND), không expose trong Expo managed.
 */
export type FlagKey =
  'basicMode' | 'autoStart' | 'autoBreak' | 'notify' | 'chime' | 'ongoing' | 'keepAwake';

export type Flags = Record<FlagKey, boolean>;

/**
 * Nguồn âm thanh phát trong phiên: một bản nhạc nền, hoặc một tiếng tick — **không bao giờ
 * cả hai**.
 *
 * Trước đây là hai hệ song song (cờ `enabled` + `trackId` cho nhạc, `tickId` cho tick) nên
 * bật cả hai được, và phải có một quy tắc trọng tài riêng để quyết định player nào giữ
 * foreground service. Một lựa chọn duy nhất bỏ được cả hai chuyện đó.
 */
export type SoundKind = 'track' | 'tick';

export interface SoundChoice {
  kind: SoundKind;
  /** id trong `TRACKS` hoặc trong `TICKS`, tuỳ `kind` */
  id: string;
}

/**
 * Ba tiếng tick đi kèm app. Là union chứ không phải `string` để `constants/i18n.ts` buộc
 * phải có nhãn cho từng tiếng — thêm một tiếng mà quên dịch là TypeScript báo đỏ.
 */
export type TickId = 'soft' | 'clock' | 'wood';

/**
 * Một tiếng tick.
 *
 * Không có field giấy phép như `Track`: cả ba file đều do ffmpeg tổng hợp trong repo này
 * (lệnh sinh ghi ở `assets/audio/README.md`), không có ai để ghi credit. Nhãn hiển thị
 * nằm ở `t.sound.tickNames` chứ không ở đây — "Tick nhẹ" là chữ cần dịch, khác với tên riêng
 * của một bản nhạc.
 */
export interface TickSound {
  id: TickId;
  /** Key trong `TICK_SOURCES` (constants/ticks.ts) trỏ tới file require() */
  source: string;
}

export interface Task {
  id: string;
  name: string;
  /** Số phiên focus đã hoàn thành cho task này */
  completed: number;
  createdAt: number;
  archived: boolean;
}

/** Một phiên focus đã kết thúc — nguồn duy nhất để dựng mọi số liệu ở màn Record */
export interface SessionLog {
  id: string;
  taskId: string | null;
  taskName: string;
  startedAt: number;
  endedAt: number;
  /** Thời gian thực sự tập trung (ms) — ngắn hơn `plannedMs` nếu kết thúc sớm */
  durationMs: number;
  /** Thời lượng dự kiến của phiên (ms) */
  plannedMs: number;
  /** false = user bấm "End session early" */
  completed: boolean;
}

/** Số liệu dựng từ `SessionLog[]` — xem utils/stats.ts */
export interface DerivedStats {
  sessionsToday: number;
  focusedTodayMs: number;
  interruptionsToday: number;
  dayStreak: number;
  sessionsThisWeek: number;
  focusedThisWeekMs: number;
  medianSessionMs: number;
  completionRate: number;
  /** 7 ngày gần nhất, cũ → mới. `weekday` 0 = Thứ Hai, dùng để tra nhãn `record.days` */
  week: { day: string; weekday: number; count: number }[];
}

/**
 * Một bản nhạc nền đi kèm app.
 *
 * Các field license là **bắt buộc** — cố ý. Thêm track mà không ghi nguồn/giấy phép thì
 * TypeScript báo lỗi ngay, nên không thể "để sau rồi bổ sung". Màn credit
 * (`app/licenses.tsx`) sinh thẳng từ những field này.
 */
export interface Track {
  id: string;
  /** Key trong `TRACK_SOURCES` (constants/tracks.ts) trỏ tới file require() */
  source: string;
  title: string;
  artist: string;
  /** Tên giấy phép, vd 'CC BY 4.0', 'CC0 1.0', 'Epidemic Sound — Commercial' */
  license: string;
  /** Link tới trang gốc của bản nhạc hoặc tới toàn văn giấy phép */
  sourceUrl: string;
  /**
   * Câu credit **nguyên văn** mà giấy phép bắt phải hiển thị, in y hệt ở màn credit.
   *
   * CC BY quy định rõ câu chữ — vd Incompetech đòi đúng dạng
   * `"Title" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0`.
   * Tự ghép từ `artist` + `license` sẽ ra câu sai chuẩn, nên phải chép nguyên vào đây.
   *
   * `null` khi giấy phép không đòi credit (CC0).
   */
  attribution: string | null;
  /**
   * Giấy phép có cho phép nhúng + phát hành kèm trong binary của app không.
   * Phải tự xác nhận trước khi bật `true` — quyền sync cho video KHÔNG bao gồm quyền này.
   */
  clearedForAppEmbedding: true;
}
