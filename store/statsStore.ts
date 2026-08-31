import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionLog } from '../types';

/** Giữ tối đa 1 năm phiên — mọi số liệu ở màn Record chỉ nhìn lại tối đa 7 ngày */
const KEEP_MS = 365 * 24 * 60 * 60 * 1000;

interface StatsState {
  sessions: SessionLog[];
  logSession: (session: Omit<SessionLog, 'id'>) => void;
  clear: () => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      sessions: [],

      logSession: (session) =>
        set((state) => {
          const cutoff = Date.now() - KEEP_MS;
          const kept = state.sessions.filter((s) => s.endedAt >= cutoff);
          return {
            sessions: [
              ...kept,
              { ...session, id: `${session.endedAt.toString(36)}-${kept.length}` },
            ],
          };
        }),

      clear: () => set({ sessions: [] }),
    }),
    {
      name: 'stats-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
