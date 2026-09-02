import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlagKey, Flags, FocusMinutes, Lang } from '../types';

/**
 * Mặc định khớp dòng meta ở màn Onboarding của design: `25 / 5 / 15 · 4 per set`.
 * Chỉ `focusMinutes` đổi được trong Settings (design chỉ vẽ 4 lựa chọn cho nó).
 */
const DEFAULT_FLAGS: Flags = {
  autoStart: true,
  autoBreak: false,
  chime: true,
  ongoing: true,
  keepAwake: true,
};

interface SettingsState {
  language: Lang;
  setLanguage: (language: Lang) => void;

  focusMinutes: FocusMinutes;
  setFocusMinutes: (focusMinutes: FocusMinutes) => void;

  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsPerSet: number;

  flags: Flags;
  toggleFlag: (key: FlagKey) => void;

  hasOnboarded: boolean;
  setHasOnboarded: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (language) => set({ language }),

      focusMinutes: 25,
      setFocusMinutes: (focusMinutes) => set({ focusMinutes }),

      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsPerSet: 4,

      flags: DEFAULT_FLAGS,
      toggleFlag: (key) =>
        set((state) => ({ flags: { ...state.flags, [key]: !state.flags[key] } })),

      hasOnboarded: false,
      setHasOnboarded: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Merge của zustand là merge nông: `flags` đọc từ máy thay nguyên object mặc định,
      // nên cờ mới thêm về sau sẽ là `undefined` với bản đã cài từ trước. Vá lại ở đây.
      //
      // `persisted` là `undefined` khi trong máy CHƯA có gì — zustand vẫn gọi `merge` ở
      // lần chạy đầu tiên (`hydrate()` trả `[false, void 0]` rồi đưa thẳng vào đây). Thiếu
      // `?? {}` là ném TypeError, mà throw trong chuỗi hydrate thì persist nuốt vào
      // `.catch`: `hasHydrated()` ở lại `false` vĩnh viễn và app treo màn đen ngay lần mở
      // đầu tiên. Kiểu của `persisted` là `unknown` nên `as` không bắt được — xem
      // `tasks/16-hydration-deadlock.md`.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        return { ...current, ...saved, flags: { ...DEFAULT_FLAGS, ...(saved.flags ?? {}) } };
      },
    },
  ),
);
