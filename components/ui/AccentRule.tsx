import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '../../hooks/useColors';

interface Props {
  width?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Vạch accent ngắn 52x1 — mở đầu màn Onboarding và màn Done.
 * Nocturne: vạch tự do thì mờ dần hai đầu, nhưng "short accent marks stay solid",
 * nên vạch này để đặc.
 */
export function AccentRule({ width = 52, style }: Props) {
  const colors = useColors();
  return <View style={[{ width, height: 1, backgroundColor: colors.accent }, style]} />;
}
