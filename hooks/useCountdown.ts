import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTimerStore } from '../store/timerStore';

/**
 * Giữ `remainingMs` khớp đồng hồ hệ thống.
 *
 * Tick 500ms (không phải 1000ms) để con số giây hiển thị không trễ tới gần một giây so
 * với thời gian thật. Bản thân tick không tự trừ gì cả — nó chỉ gọi `sync()`, còn mọi
 * phép tính đều từ `endAt`, nên app ngủ bao lâu cũng không làm đồng hồ sai.
 */
export function useCountdown(): void {
  const status = useTimerStore((s) => s.status);
  const sync = useTimerStore((s) => s.sync);

  useEffect(() => {
    sync();
    if (status !== 'running') return;
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [status, sync]);

  // Quay lại foreground: bù lại toàn bộ khoảng app bị treo
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);
}
