import React from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { tracking, typography } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  /** Mặc định `textMuted` — design dùng accent300 cho kicker màn Break */
  color?: string;
  /** Bậc cách chữ, xem `tracking` trong constants/theme.ts */
  space?: keyof typeof tracking;
  style?: StyleProp<TextStyle>;
}

/** Nhãn section UPPERCASE cách chữ rộng — xuất hiện ở đầu mọi màn trong design */
export function Kicker({ children, color, space = 'widest', style }: Props) {
  const colors = useColors();
  return (
    <Text
      style={[
        typography.kicker,
        { letterSpacing: tracking[space], color: color ?? colors.textMuted },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
