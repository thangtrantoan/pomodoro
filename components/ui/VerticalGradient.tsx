import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface Props {
  from: string;
  to: string;
  /** Vị trí (0→1) màu đã chuyển hẳn sang `to` — design màn Break dùng 0.55 */
  stop?: number;
}

/**
 * Nền chuyển màu dọc, phủ toàn bộ phần tử cha.
 *
 * Dùng `react-native-svg` thay vì `expo-linear-gradient` — svg đã có sẵn cho vòng
 * tiến trình nên không cần thêm dependency thứ hai chỉ để đổ một nền.
 */
export function VerticalGradient({ from, to, stop = 0.55 }: Props) {
  const gradientId = `vgrad-${useId()}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset={String(stop)} stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
  );
}
