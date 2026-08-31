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
 * Design có thêm 1 công tắc không dựng được trong Expo managed nên đã bỏ, không làm
 * công tắc chết:
 * - "Silence notifications": muốn tắt thông báo toàn máy phải có quyền
 *   ACCESS_NOTIFICATION_POLICY (Android DND), không expose trong Expo managed.
 */
export type FlagKey = 'autoStart' | 'chime' | 'ongoing' | 'keepAwake';

export type Flags = Record<FlagKey, boolean>;

export interface Task {
  id: string;
  name: string;
  /** Số pomodoro ước lượng, null = "no estimate" */
  estimate: number | null;
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
