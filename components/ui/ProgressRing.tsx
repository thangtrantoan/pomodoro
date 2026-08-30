import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';

interface Props {
  /** Đường kính ngoài (px) */
  size: number;
  /** 0 → 1. 0 = vòng rỗng, 1 = vòng đầy */
  progress: number;
  strokeWidth?: number;
  /** Màu cung chạy — mặc định accent */
  color?: string;
  trackColor?: string;
  /** Mờ cung chạy đi (màn Break dùng .8) */
  opacity?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Vòng tiến trình theo design: nét mảnh, đầu bo tròn, chạy từ 12 giờ theo chiều kim đồng hồ.
 * `rotation={-90}` trên `Svg` thay cho `transform: rotate(-90deg)` của bản web.
 */
export function ProgressRing({
  size,
  progress,
  strokeWidth = 2,
  color,
  trackColor,
  opacity = 1,
  children,
  style,
}: Props) {
  const colors = useColors();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor ?? colors.statBarBg}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? colors.statBarFill}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          opacity={opacity}
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>
      {children}
    </View>
  );
}
