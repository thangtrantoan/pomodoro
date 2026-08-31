import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { numeral, radius, weight } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Số liệu (độ dài phiên) dùng tabular-nums cho thẳng cột */
  tabular?: boolean;
  style?: StyleProp<ViewStyle>;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 8 },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnActive: { borderColor: c.accent, backgroundColor: c.accent900 },
    label: { fontSize: 14, fontWeight: weight.regular, color: c.textSecondary },
    labelActive: { color: c.accent200 },
  });
}

/**
 * Toggle phân đoạn theo design: các ô rời nhau (gap 8), ô đang chọn viền accent + nền
 * accent900 — không phải kiểu pill liền khối của Material.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tabular = false,
  style,
}: Props<T>) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[s.row, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[s.btn, active && s.btnActive]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <Text style={[s.label, active && s.labelActive, tabular && numeral]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
