import { type TextStyle } from 'react-native';

/**
 * Font: design Nocturne dùng Inter (300/400/500). Project không cài `@expo-google-fonts/inter`
 * nên dùng **system font + fontWeight số** — RN map '300' sang sans-serif-light (Android) /
 * SF Light (iOS). Không set `fontFamily` ở đâu cả; muốn đúng Inter thì thêm dep rồi khai báo
 * `fonts.sans` ở đây, các preset bên dưới không phải sửa.
 */
export const weight = {
  light: '300',
  regular: '400',
  medium: '500',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Thang cách chữ của kicker uppercase — design ghi bằng `em`, đây là px đã nhân theo cỡ 11 */
export const tracking = {
  wide: 0.88,
  wider: 1.1,
  widest: 1.54,
  ultra: 1.76,
  mega: 2.2,
  giga: 2.42,
} as const;

/**
 * Preset typography lấy từ design. Numeral lớn luôn đi kèm `fontVariant: ['tabular-nums']`
 * (xem `numeral`) để đồng hồ không nhảy chiều rộng mỗi giây.
 */
export const numeral: TextStyle = { fontVariant: ['tabular-nums'] };

export const typography = {
  /** Đồng hồ chính màn Timer — 62px */
  clock: { fontSize: 62, fontWeight: weight.light, letterSpacing: -2.17, lineHeight: 62 },
  /** Đồng hồ màn Break — 52px */
  clockBreak: { fontSize: 52, fontWeight: weight.light, letterSpacing: -1.82, lineHeight: 52 },
  /** Số lớn màn Record — 54px */
  statHero: { fontSize: 54, fontWeight: weight.light, letterSpacing: -1.89, lineHeight: 54 },
  /** Tiêu đề Onboarding — 38px */
  displayLg: { fontSize: 38, fontWeight: weight.light, letterSpacing: -1.14, lineHeight: 40 },
  /** Tiêu đề màn Done — 32px */
  displayMd: { fontSize: 32, fontWeight: weight.light, letterSpacing: -0.96, lineHeight: 35 },
  /** Ô số trong grid Done — 26px */
  statLg: { fontSize: 26, fontWeight: weight.light, letterSpacing: -0.52, lineHeight: 26 },
  /** Ô số trong grid Record — 22px */
  statMd: { fontSize: 22, fontWeight: weight.light, lineHeight: 22 },
  /** Tên task dưới đồng hồ — 15px */
  title: { fontSize: 15, fontWeight: weight.regular, lineHeight: 21 },
  /** Body copy — 14px/1.6 */
  body: { fontSize: 14, fontWeight: weight.regular, lineHeight: 22 },
  /** Tên task trong Queue — 14px/1.35 */
  itemTitle: { fontSize: 14, fontWeight: weight.regular, lineHeight: 19 },
  /** Dòng meta phụ — 12px */
  small: { fontSize: 12, fontWeight: weight.regular, lineHeight: 17 },
  /** Hint dưới label Settings — 11px/1.45 */
  hint: { fontSize: 11, fontWeight: weight.regular, lineHeight: 16 },
  /** Nhãn trục biểu đồ — 10px */
  micro: { fontSize: 10, fontWeight: weight.regular, lineHeight: 14 },
  /** Nhãn section UPPERCASE — cỡ cố định 11, letterSpacing truyền qua `tracking` */
  kicker: { fontSize: 11, fontWeight: weight.regular, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
