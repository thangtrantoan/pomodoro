import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatedSheet } from './AnimatedSheet';
import { Button } from './Button';
import { TextField } from './TextField';
import { spacing } from '../../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  label: string;
  confirmLabel: string;
  initialValue?: string;
  onDismiss: () => void;
  onConfirm: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** Popup nhập một dòng text — thêm/đổi tên việc. */
export function PromptSheet({
  visible,
  title,
  label,
  confirmLabel,
  initialValue,
  onDismiss,
  onConfirm,
  style,
}: Props) {
  const valueRef = useRef('');
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (visible) {
      valueRef.current = initialValue ?? '';
      // Remount ô nhập để `defaultValue` mới có hiệu lực
      setInputKey((k) => k + 1);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    const trimmed = valueRef.current.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <AnimatedSheet
      visible={visible}
      title={title}
      onDismiss={onDismiss}
      style={style}
      actions={
        <Button variant="primary" height={44} style={styles.action} onPress={handleConfirm}>
          {confirmLabel}
        </Button>
      }
    >
      <View style={styles.content}>
        <TextField
          key={inputKey}
          placeholder={label}
          defaultValue={initialValue ?? ''}
          onChangeText={(text) => {
            valueRef.current = text;
          }}
          onSubmitEditing={handleConfirm}
          returnKeyType="done"
          autoFocus
          autoCorrect={false}
        />
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  action: { flex: 1 },
});
