import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { radius, spacing } from '../../constants/theme';

/**
 * Ô nhập theo class `.input` của Nocturne: nền surface, viền divider,
 * caret accent, viền chuyển accent khi focus.
 */
export function TextField(props: TextInputProps) {
  const c = useColors();
  const [focused, setFocused] = React.useState(false);

  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={c.textFaint}
      selectionColor={c.accent}
      cursorColor={c.accent}
      style={[
        styles.input,
        {
          backgroundColor: c.surface,
          borderColor: focused ? c.accent : c.borderStrong,
          color: c.text,
        },
        props.multiline && styles.multiline,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
