import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Phase, TimerStatus } from '../types';
import { minutesToMs } from '../utils/time';
import { useSettingsStore } from './settingsStore';
import { useTaskStore } from './taskStore';
import { useStatsStore } from './statsStore';

/**
 * Đồng hồ chạy theo **mốc thời gian tuyệt đối** `endAt`, không đếm lùi một biến.
 * `setInterval` của JS không chạy khi app bị đưa xuống nền hoặc màn hình tắt, nên mọi
 * lần quay lại foreground `sync()` phải tính lại từ `Date.now()` — nếu không đồng hồ
 * sẽ chậm đúng bằng khoảng thời gian app ngủ.
 *
 * `remainingMs` là nguồn sự thật khi KHÔNG chạy (idle/paused/completed);
 * `endAt` là nguồn sự thật khi đang chạy.
 */
interface TimerState {
  phase: Phase;
  status: TimerStatus;
  endAt: number | null;
  remainingMs: number;
  /** Thời lượng dự kiến của phiên hiện tại */
  plannedMs: number;
  /** Lúc phiên focus hiện tại bắt đầu lần đầu — để ghi log */
  startedAt: number | null;
  /** Vị trí phiên trong set, 1..sessionsPerSet */
  sessionNo: number;
  /** Thời lượng phiên vừa kết thúc — màn Done hiển thị lại con số này */
  lastSessionMs: number;

  /** Tính lại từ đồng hồ hệ thống; tự xử lý khi phiên đã hết giờ lúc app đang ngủ */
  sync: () => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  /** Kết thúc phiên focus sớm — ghi log là phiên chưa hoàn thành */
  endEarly: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  /** "End set for today" — về phiên 1, không chạy */
  endSet: () => void;
  /** Áp độ dài phiên mới từ Settings (chỉ khi đang không chạy) */
  applyFocusLength: () => void;
}

function focusMs(): number {
  return minutesToMs(useSettingsStore.getState().focusMinutes);
}

function breakMsFor(phase: Phase): number {
  const { shortBreakMinutes, longBreakMinutes } = useSettingsStore.getState();
  return minutesToMs(phase === 'longBreak' ? longBreakMinutes : shortBreakMinutes);
}

/** Ghi một phiên focus vào stats và cộng pomodoro cho task đang chọn */
function logFocusSession(startedAt: number, plannedMs: number, durationMs: number, done: boolean) {
  const { tasks, currentTaskId, incrementCompleted } = useTaskStore.getState();
  const task = tasks.find((t) => t.id === currentTaskId) ?? null;

  useStatsStore.getState().logSession({
    taskId: task?.id ?? null,
    taskName: task?.name ?? '',
    startedAt,
    endedAt: Date.now(),
    durationMs,
    plannedMs,
    completed: done,
  });

  if (done && task) incrementCompleted(task.id);
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      phase: 'focus',
      status: 'idle',
      endAt: null,
      remainingMs: minutesToMs(25),
      plannedMs: minutesToMs(25),
      startedAt: null,
      sessionNo: 1,
      lastSessionMs: 0,

      sync: () => {
        const { status, endAt, phase } = get();
        if (status !== 'running' || endAt === null) return;

        const now = Date.now();
        if (now < endAt) {
          set({ remainingMs: endAt - now });
          return;
        }

        if (phase === 'focus') {
          const { startedAt, plannedMs } = get();
          logFocusSession(startedAt ?? endAt - plannedMs, plannedMs, plannedMs, true);
          set({
            status: 'completed',
            endAt: null,
            remainingMs: 0,
            lastSessionMs: plannedMs,
          });
          return;
        }

        // Hết giờ nghỉ. Nếu app ngủ qua mốc này thì phiên focus mới tính từ *bây giờ*,
        // không tính từ mốc cũ — nếu không user sẽ mở app ra và thấy phiên đã trôi mất.
        get().skipBreak();
        if (useSettingsStore.getState().flags.autoStart) get().start();
      },

      start: () => {
        const { remainingMs, startedAt, phase } = get();
        set({
          status: 'running',
          endAt: Date.now() + remainingMs,
          startedAt: phase === 'focus' ? (startedAt ?? Date.now()) : startedAt,
        });
      },

      pause: () => {
        const { endAt, status } = get();
        if (status !== 'running' || endAt === null) return;
        set({
          status: 'paused',
          remainingMs: Math.max(0, endAt - Date.now()),
          endAt: null,
        });
      },

      toggle: () => {
        if (get().status === 'running') get().pause();
        else get().start();
      },

      endEarly: () => {
        const { status, endAt, remainingMs, plannedMs, startedAt } = get();
        const left =
          status === 'running' && endAt !== null ? Math.max(0, endAt - Date.now()) : remainingMs;
        const elapsed = Math.max(0, plannedMs - left);

        logFocusSession(startedAt ?? Date.now() - elapsed, plannedMs, elapsed, false);
        set({
          status: 'completed',
          endAt: null,
          remainingMs: 0,
          lastSessionMs: elapsed,
        });
      },

      startBreak: () => {
        const { sessionNo } = get();
        const { sessionsPerSet } = useSettingsStore.getState();
        const phase: Phase = sessionNo >= sessionsPerSet ? 'longBreak' : 'shortBreak';
        const planned = breakMsFor(phase);

        set({
          phase,
          status: 'running',
          plannedMs: planned,
          remainingMs: planned,
          endAt: Date.now() + planned,
          startedAt: null,
        });
      },

      skipBreak: () => {
        const { phase, sessionNo } = get();
        const { sessionsPerSet } = useSettingsStore.getState();
        const planned = focusMs();

        set({
          phase: 'focus',
          status: 'idle',
          plannedMs: planned,
          remainingMs: planned,
          endAt: null,
          startedAt: null,
          // Sau nghỉ dài là hết set — quay về phiên 1
          sessionNo: phase === 'longBreak' || sessionNo >= sessionsPerSet ? 1 : sessionNo + 1,
        });
      },

      endSet: () => {
        const planned = focusMs();
        set({
          phase: 'focus',
          status: 'idle',
          plannedMs: planned,
          remainingMs: planned,
          endAt: null,
          startedAt: null,
          sessionNo: 1,
        });
      },

      applyFocusLength: () => {
        const { status, phase } = get();
        // Đang chạy dở thì không cắt ngang — độ dài mới áp cho phiên sau
        if (phase !== 'focus' || status === 'running' || status === 'paused') return;
        const planned = focusMs();
        set({ plannedMs: planned, remainingMs: planned });
      },
    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // `sync()` ngay khi đọc xong state cũ: app có thể đã tắt suốt cả phiên
      onRehydrateStorage: () => (state) => state?.sync(),
    },
  ),
);
