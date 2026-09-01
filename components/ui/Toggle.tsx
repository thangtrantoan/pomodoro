import React, { useEffect } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { spacing, typography } from '../../constants/theme';

interface Props {
  label: string;
  hint: string;
  value: boolean;
  onToggle: () => void;
  /** Công tắc vẫn ở đó nhưng lúc này không có tác dụng — làm mờ và chặn bấm */
  disabled?: boolean;
}

/**
 * Hàng cài đặt có công tắc. Design vẽ công tắc riêng 38x22 (viền + núm 14px trượt),
 * không phải `Switch` của Paper — dùng Switch sẽ ra Material, lạc khỏi hệ Nocturne.
 */
export function Toggle({ label, hint, value, onToggle, disabled = false }: Props) {
  const c = useColors();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', c.accent800]),
    borderColor: interpolateColor(progress.value, [0, 1], [c.neutral800, c.accent600]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    left: 3 + progress.value * 16,
    backgroundColor: interpolateColor(progress.value, [0, 1], [c.neutral600, c.accent200]),
  }));

  return (
    <Pressable
      style={[styles.row, disabled && styles.rowDisabled, { borderTopColor: c.border }]}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <View style={styles.text}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        <Text style={[typography.hint, styles.hint, { color: c.textFaint }]}>{hint}</Text>
      </View>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowDisabled: { opacity: 0.4 },
  text: { flex: 1 },
  label: { fontSize: 14 },
  hint: { marginTop: 3 },
  track: {
    width: 38,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
