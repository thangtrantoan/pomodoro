import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { ConfirmSheet } from './ConfirmSheet';
import { useT } from '../../hooks/useT';
import { useColors } from '../../hooks/useColors';
import type { MaterialIconName } from '../../types';

interface Props {
  visible: boolean;
  title: string;
  itemTitle: string;
  subtitle?: string;
  icon?: MaterialIconName;
  onDismiss: () => void;
  onConfirm: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Wrapper của ConfirmSheet cho hành động xoá — luôn destructive, luôn ẩn nút Hủy. */
export function ConfirmDeleteSheet({ icon = 'delete-outline', ...props }: Props) {
  const t = useT();
  const c = useColors();
  return (
    <ConfirmSheet
      {...props}
      icon={icon}
      iconColor={c.danger}
      destructive
      hideCancel
      confirmLabel={t.common.delete}
    />
  );
}
