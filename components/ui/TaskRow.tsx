import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { numeral, spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

interface Props {
  name: string;
  meta: string;
  count: string;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.xl,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    pressed: { backgroundColor: c.neutral900 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { backgroundColor: c.accent },
    dotIdle: { backgroundColor: c.borderStrong },
    body: { flex: 1, minWidth: 0 },
    name: { ...typography.itemTitle },
    nameActive: { color: c.text },
    nameIdle: { color: c.textSecondary },
    meta: { ...typography.hint, color: c.textFaint, marginTop: 3 },
    count: { ...typography.small, color: c.textMuted },
  });
}

/** Một dòng trong hàng đợi: chấm trạng thái · tên + meta · số pomodoro */
export function TaskRow({ name, meta, count, active, onPress, onLongPress }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={name}
      accessibilityHint={meta}
    >
      <View style={[s.dot, active ? s.dotActive : s.dotIdle]} />
      <View style={s.body}>
        <Text style={[s.name, active ? s.nameActive : s.nameIdle]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.meta}>{meta}</Text>
      </View>
      <Text style={[s.count, numeral]}>{count}</Text>
    </Pressable>
  );
}
