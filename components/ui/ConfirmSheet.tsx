import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedSheet } from './AnimatedSheet';
import { Button } from './Button';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { radius, spacing, typography } from '../../constants/theme';
import type { MaterialIconName } from '../../types';

interface Props {
  visible: boolean;
  title: string;
  icon: MaterialIconName;
  iconColor: string;
  itemTitle: string;
  subtitle?: string;
  confirmLabel?: string;
  /** Nút xác nhận chuyển sang màu danger — hành động không hoàn tác được */
  destructive?: boolean;
  /** Ẩn nút Hủy — đóng bằng cách chạm ra ngoài */
  hideCancel?: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Popup xác nhận — dùng thay cho `Alert.alert` ở mọi chỗ cần xác nhận hành động. */
export function ConfirmSheet({
  visible,
  title,
  icon,
  iconColor,
  itemTitle,
  subtitle,
  confirmLabel,
  destructive,
  hideCancel,
  onDismiss,
  onConfirm,
  style,
}: Props) {
  const c = useColors();
  const t = useT();

  return (
    <AnimatedSheet
      visible={visible}
      title={title}
      onDismiss={onDismiss}
      style={style}
      actions={
        <>
          {!hideCancel && (
            <Button variant="secondary" height={44} style={styles.action} onPress={onDismiss}>
              {t.common.cancel}
            </Button>
          )}
          <Button
            variant={destructive ? 'danger' : 'primary'}
            height={44}
            style={styles.action}
            onPress={onConfirm}
          >
            {confirmLabel ?? t.common.confirm}
          </Button>
        </>
      }
    >
      <View style={styles.wrap}>
        <View style={[styles.row, { backgroundColor: c.background }]}>
          <View style={[styles.iconCircle, { borderColor: iconColor }]}>
            <MaterialIcons name={icon} size={18} color={iconColor} />
          </View>
          <View style={styles.body}>
            <Text style={[typography.title, { color: c.text }]} numberOfLines={2}>
              {itemTitle}
            </Text>
            {subtitle ? (
              <Text style={[typography.hint, { color: c.textFaint, marginTop: 3 }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  action: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    padding: 14,
    gap: spacing.md,
  },
  // Nocturne: nhấn bằng viền, không phải mảng nền tô đặc
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
});
