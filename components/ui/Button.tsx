import React, { useMemo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { radius, weight } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

/**
 * Chữ ký của Nocturne: **nút chính là viền accent trên nền trong suốt, không tô đặc**
 * ("Buttons are outlined (1px accent border on transparent), not solid-filled" — readme
 * của design system). Đừng đổi `primary` thành nền đặc.
 *
 * - `primary`   viền accent — Begin, Start/Pause, Take the break
 * - `secondary` viền trung tính — Skip break
 * - `ghost`     không viền, chữ mờ — End session early, End set for today
 * - `dashed`    viền đứt — Add task
 * - `danger`    viền danger — hành động xoá
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'dashed' | 'danger';

interface Props {
  variant?: Variant;
  onPress: () => void;
  disabled?: boolean;
  /** Design ghi chiều cao tường minh cho từng chỗ: 56 / 52 / 48 / 40 */
  height?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    primary: { borderColor: c.accent },
    secondary: { borderColor: c.borderStrong },
    ghost: { borderWidth: 0 },
    dashed: { borderColor: c.borderStrong, borderStyle: 'dashed' },
    danger: { borderColor: c.danger },

    pressed: { backgroundColor: c.accent900 },
    disabled: { opacity: 0.45 },

    label: { fontSize: 15, fontWeight: weight.medium },
    primaryLabel: { color: c.accent },
    secondaryLabel: { fontSize: 14, color: c.neutral300 },
    ghostLabel: {
      fontSize: 12,
      fontWeight: weight.regular,
      letterSpacing: 0.72,
      color: c.textFaint,
    },
    dashedLabel: { fontSize: 13, fontWeight: weight.regular, color: c.textMuted },
    dangerLabel: { fontSize: 14, color: c.danger },
  });
}

export function Button({
  variant = 'primary',
  onPress,
  disabled,
  height = 52,
  children,
  style,
}: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const shape = s[variant];
  const label =
    variant === 'primary'
      ? s.primaryLabel
      : variant === 'secondary'
        ? s.secondaryLabel
        : variant === 'ghost'
          ? s.ghostLabel
          : variant === 'dashed'
            ? s.dashedLabel
            : s.dangerLabel;

  return (
    <Pressable
      style={({ pressed }) => [
        s.base,
        shape,
        { height },
        pressed && !disabled && s.pressed,
        disabled && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[s.label, label]}>{children}</Text>
    </Pressable>
  );
}
