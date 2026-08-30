import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useTimerStore } from '../store/timerStore';
import { useStatsStore } from '../store/statsStore';
import { useAudioStore } from '../store/audioStore';

const stores = [
  useSettingsStore,
  useTaskStore,
  useTimerStore,
  useStatsStore,
  useAudioStore,
] as const;

function allHydrated(): boolean {
  return stores.every((s) => s.persist.hasHydrated());
}

/** true khi mọi store đã đọc xong AsyncStorage — render trước đó sẽ nháy state mặc định */
export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    if (hydrated) return;

    function check() {
      if (allHydrated()) setHydrated(true);
    }

    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    check();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [hydrated]);

  return hydrated;
}
