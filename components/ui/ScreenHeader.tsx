import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { Kicker } from './Kicker';
import { radius, spacing, typography } from '../../constants/theme';

interface Props {
  title: string;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Kicker trái + nút Close phải — đầu màn Queue / Record / Settings */
export function ScreenHeader({ title, onClose, style }: Props) {
  const c = useColors();
  const t = useT();

  return (
    <View style={[styles.row, style]}>
      <Kicker>{title}</Kicker>
      <Pressable
        style={styles.close}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t.common.close}
        hitSlop={8}
      >
        <Text style={[typography.hint, { color: c.textMuted }]}>{t.common.close}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  close: {
    height: 40,
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});
