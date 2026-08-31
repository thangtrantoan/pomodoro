import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

interface Props {
  label: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    pressed: { backgroundColor: c.neutral900 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotOn: { backgroundColor: c.accent },
    dotOff: { backgroundColor: c.borderStrong },
    body: { flex: 1 },
    label: { fontSize: 14 },
    labelOn: { color: c.text },
    labelOff: { color: c.textSecondary },
    meta: { ...typography.hint, color: c.textFaint, marginTop: 3 },
  });
}

/** Một lựa chọn trong danh sách chọn-một — chấm accent bên trái giống hàng Queue */
export function ChoiceRow({ label, meta, selected, onPress }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.pressed]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={[s.dot, selected ? s.dotOn : s.dotOff]} />
      <View style={s.body}>
        <Text style={[s.label, selected ? s.labelOn : s.labelOff]} numberOfLines={1}>
          {label}
        </Text>
        {meta ? <Text style={s.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}
