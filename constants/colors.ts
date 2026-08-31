/**
 * Palette "Nocturne" — port nguyên bản từ design system của project Claude Design
 * `_ds/nocturne-e3226d70-8950-4fc8-81e7-00d935e22d7f/styles.css`.
 *
 * Nocturne là hệ **dark thuần**: nền xanh-xám gần trung tính (#161826), accent blurple
 * dùng như một đường kẻ / quầng sáng chứ không phải mảng màu. Hệ không định nghĩa
 * light theme nên app cũng chỉ có một bảng màu — `useColors()` vẫn là accessor duy nhất
 * để sau này thêm light theme không phải sửa lại component nào.
 *
 * Ramp 100–900 sinh trong OKLCH trên cùng một thang lightness, nên cùng một bậc của
 * mọi ramp có cùng trọng lượng thị giác. Ưu tiên dùng bậc ramp thay cho pha màu ad-hoc.
 */

/** Ramp trung tính — 100 sáng nhất → 900 tối nhất */
const neutralRamp = {
  neutral100: '#f3f5fe',
  neutral200: '#e4e7f5',
  neutral300: '#cfd3e5',
  neutral400: '#b2b6ca',
  neutral500: '#9397ab',
  neutral600: '#75798c',
  neutral700: '#595d6c',
  neutral800: '#3f424d',
  neutral900: '#292b31',
} as const;

/** Ramp accent (blurple) — hệ mono, chỉ một giọng accent duy nhất */
const accentRamp = {
  accent100: '#f5f4ff',
  accent200: '#e7e5fe',
  accent300: '#d2cefd',
  accent400: '#b5abfc',
  accent500: '#968ae0',
  accent600: '#796cbf',
  accent700: '#5d5294',
  accent800: '#423a6a',
  accent900: '#2b2741',
} as const;

export const nocturneColors = {
  ...neutralRamp,
  ...accentRamp,

  // Background
  background: '#161826',
  surface: '#232532',
  surfaceVariant: neutralRamp.neutral900,

  // Brand — hệ mono: `accent` trùng `primary` (Nocturne chỉ có một accent,
  // biến --color-accent-2-* trong styles.css chỉ là stand-in máy sinh ra)
  primary: '#9184d9',
  primaryLight: accentRamp.accent900,
  accent: '#9184d9',
  accentLight: accentRamp.accent900,
  onAccent: '#161826',

  // On-primary — accent hiếm khi làm nền mảng, chỉ dùng cho chấm/thanh đặc
  onPrimary: '#161826',
  onPrimaryMuted: 'rgba(22,24,38,0.66)',
  onPrimaryFaint: 'rgba(22,24,38,0.5)',
  onPrimaryOverlay: 'rgba(233,233,237,0.16)',
  onPrimaryOverlayBorder: 'rgba(233,233,237,0.28)',

  // Text
  text: '#e9e9ed',
  textSecondary: neutralRamp.neutral400,
  textMuted: neutralRamp.neutral500,
  textFaint: neutralRamp.neutral600,
  /** Mờ hơn `textFaint` — dòng version ở cuối Settings */
  textGhost: neutralRamp.neutral700,

  // UI
  border: neutralRamp.neutral900,
  borderStrong: neutralRamp.neutral800,
  backdrop: 'rgba(13,14,26,0.75)',
  /** Nocturne không có vai trò danger — thêm mới, giữ chroma thấp cho hợp hệ */
  danger: '#e5817f',
  dangerLight: '#2f2028',

  // Stat bars — vòng tiến trình phiên + cột biểu đồ 7 ngày
  statBarBg: neutralRamp.neutral900,
  statBarFill: '#9184d9',
  statBarSubdued: accentRamp.accent800,
} as const;

export type AppColors = typeof nocturneColors;
