import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Quyền thông báo còn hay đã mất. `null` = chưa kiểm xong.
 *
 * `useNotificationSync` có gọi `ensurePermissions()` lúc mount nhưng bỏ qua kết quả, nên
 * user từ chối là app im lặng mà không nói gì. Hook này để màn Settings nói ra.
 *
 * Kiểm lại mỗi lần app quay về foreground: user có thể vừa ra cài đặt hệ thống bật/tắt
 * quyền rồi quay lại, mà màn Settings thì không unmount trong lúc đó.
 */
export function useNotificationPermission(): boolean | null {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback(() => {
    void Notifications.getPermissionsAsync().then((res) => setGranted(res.granted));
  }, []);

  useEffect(() => {
    // Trên web expo-notifications đi qua Web Push, không liên quan gì tới chuông hết
    // phiên của app này — để `null`, màn Settings sẽ không hiện cảnh báo
    if (Platform.OS === 'web') return;

    check();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  return granted;
}
