import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';

interface Props {
  size: number;
  /** Vị trí màu tắt hẳn — design dùng 70% */
  falloff?: number;
  opacity?: number;
}

/**
 * Quầng sáng accent phía sau đồng hồ —
 * `radial-gradient(circle, var(--color-accent-900) 0%, transparent 70%)` của design.
 * Nocturne dùng accent "như một đường kẻ và một quầng sáng", đây là phần quầng sáng.
 */
export function RadialGlow({ size, falloff = 0.7, opacity = 0.85 }: Props) {
  const c = useColors();
  // id phải là duy nhất trong cả document, nếu không hai glow cùng lúc sẽ dùng chung defs
  const gradientId = `glow-${useId()}`;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c.accent900} stopOpacity={opacity} />
          <Stop offset={String(falloff)} stopColor={c.accent900} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
    </Svg>
  );
}
