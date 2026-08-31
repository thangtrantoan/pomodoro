import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';

const KEEP_AWAKE_TAG = 'interval-timer';

/** Giữ sáng màn hình khi có một phiên đang chạy — gắn một lần ở root layout */
export function useKeepAwakeSync(): void {
  const status = useTimerStore((s) => s.status);
  const keepAwake = useSettingsStore((s) => s.flags.keepAwake);

  useEffect(() => {
    if (!keepAwake || status !== 'running') return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => void deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [keepAwake, status]);
}
