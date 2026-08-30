import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * expo-haptics không có gì để chạy trên web — bọc lại để màn hình gọi thoải mái
 * mà không phải rải `Platform.OS` khắp nơi.
 */
export function tapFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function lightFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function successFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
