import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '../../hooks/useColors';

interface Props {
  style?: StyleProp<ViewStyle>;
}

/**
 * Đường kẻ ngang mờ dần về bên phải — chữ ký "rules fade to transparent at their ends"
 * của Nocturne, dùng ngăn các khối ở màn Record.
 *
 * Không có gradient thật (không dùng expo-linear-gradient) nên xếp 4 đoạn giảm dần
 * độ mờ — ở nét 1px thì mắt không phân biệt được với gradient.
 */
export function FadeRule({ style }: Props) {
  const colors = useColors();
  const steps = [1, 0.66, 0.33, 0.12];
  return (
    <View style={[{ flexDirection: 'row', height: 1 }, style]}>
      {steps.map((opacity, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: colors.border, opacity }} />
      ))}
    </View>
  );
}
