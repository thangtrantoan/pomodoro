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
  chime: true,
  ongoing: true,
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
        set((state) => ({
          // Spread default trước — state persist từ bản cũ có thể thiếu key mới thêm
          flags: { ...DEFAULT_FLAGS, ...state.flags, [key]: !(state.flags[key] ?? true) },
        })),

      hasOnboarded: false,
      setHasOnboarded: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
