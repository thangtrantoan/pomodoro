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

/** Tên để in ra log — cùng thứ tự với `stores` */
const storeNames = ['settings', 'task', 'timer', 'stats', 'audio'] as const;

/**
 * Quá hạn này thì bỏ cổng hydrate, render bằng state mặc định.
 *
 * Không có nó là app **treo màn đen câm**: persist của zustand nuốt mọi lỗi hydrate mà
 * không đặt `hasHydrated` và không bắn `onFinishHydration`, nên `allHydrated()` ở lại
 * `false` vĩnh viễn. Hai đường vào trạng thái đó — `createJSONStorage` return trơn khi
 * `AsyncStorage` không dùng được, và nhánh `.catch` của chuỗi hydrate — đều không log
 * một dòng nào. Chi tiết ở `tasks/16-hydration-deadlock.md`.
 *
 * 3s là dư sức cho vài chục KB JSON kể cả trên máy yếu, mà vẫn ngắn hơn ngưỡng user cho
 * là app hỏng. Chạy mất state cũ vẫn hơn ngồi nhìn màn đen.
 */
const HYDRATION_TIMEOUT_MS = 3_000;

function allHydrated(): boolean {
  return stores.every((s) => s.persist.hasHydrated());
}

/** Tên các store chưa đọc xong — chỉ để log lúc quá hạn */
function pendingStores(): string[] {
  return storeNames.filter((_, i) => !stores[i].persist.hasHydrated());
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

    // Cửa thoát. `console.warn` là manh mối duy nhất còn lại khi chuyện này xảy ra trên
    // máy thật — xem bằng `adb logcat *:E ReactNativeJS:V`.
    const timeout = setTimeout(() => {
      const pending = pendingStores();
      if (pending.length > 0) {
        console.warn(
          `[hydration] quá ${HYDRATION_TIMEOUT_MS}ms chưa đọc xong: ${pending.join(', ')} — ` +
            'render bằng state mặc định. AsyncStorage nhiều khả năng không dùng được trong build này.',
        );
      }
      setHydrated(true);
    }, HYDRATION_TIMEOUT_MS);

    check();

    return () => {
      unsubs.forEach((unsub) => unsub());
      clearTimeout(timeout);
    };
  }, [hydrated]);

  return hydrated;
}
