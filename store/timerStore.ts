import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Phase, TimerStatus } from '../types';
import { getLocalDateStr } from '../utils/date';
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
/**
 * Ngưỡng để coi một phiên là "vừa mới hết giờ". Tick của `useCountdown` là 500ms nên
 * bình thường `sync()` phát hiện trễ dưới nửa giây; trễ hơn nhiều nghĩa là app vừa ngủ
 * dậy và mốc kết thúc đã trôi qua từ lâu.
 */
const FRESH_END_MS = 2_000;

/**
 * Hạn sử dụng của màn Done. Nó chỉ là một nhịp chờ giữa phiên vừa xong và phiên nghỉ, nhưng
 * lại được persist — không có hạn thì tắt app hôm nay, mai mở lại vẫn thấy tổng kết của
 * phiên hôm qua thay vì nút Bắt đầu.
 *
 * 30 phút vì nó dài hơn phiên nghỉ dài nhất (15'): đi nghỉ xong mở app lại vẫn còn thấy
 * màn Done nguyên vẹn, không bị cướp mất nút Nghỉ.
 */
const DONE_TTL_MS = 30 * 60 * 1000;

/**
 * Dưới mốc này thì phần đã ngồi của một phiên bị bỏ dở không được ghi vào log: bấm Bắt đầu
 * rồi Tạm dừng ngay không phải là một phiên tập trung, ghi vào chỉ làm bẩn tỉ lệ hoàn thành
 * và cột "Lần gián đoạn".
 */
const MIN_LOGGED_MS = 60 * 1000;

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
  /** Mốc phiên focus vừa kết thúc — không có nó thì không biết màn Done đã cũ bao lâu */
  completedAt: number | null;
  /** Mốc bấm Tạm dừng — không có nó thì không biết một phiên đang treo đã treo từ hôm nào */
  pausedAt: number | null;
  /**
   * Tăng một nhịp mỗi lần một phiên kết thúc **do hết giờ** — không tính kết thúc sớm
   * hay skip thủ công. `hooks/useSessionChime.ts` bám vào đây để phát chuông.
   *
   * Là số đếm chứ không phải cờ boolean: hai phiên liên tiếp cùng kết thúc thì cờ giữ
   * nguyên giá trị `true`, hook sẽ không thấy có gì thay đổi.
   */
  endedTick: number;

  /** Tính lại từ đồng hồ hệ thống; tự xử lý khi phiên đã hết giờ lúc app đang ngủ */
  sync: () => void;
  /**
   * Màn Done quá hạn thì về trạng thái sẵn sàng. Chỉ chạy từ `sync()` — tức lúc mở app và
   * lúc quay lại foreground, không có nhịp nào tự chạy, nên màn đang xem không bị giật đi.
   */
  expireDone: () => void;
  /**
   * Phiên tạm dừng từ hôm trước thì bỏ — phần đã ngồi được ghi lại thành một phiên gián
   * đoạn của *hôm đó*, rồi về phiên mới nguyên vẹn. Cũng chỉ chạy từ `sync()`.
   */
  expirePaused: () => void;
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

/**
 * Ghi một phiên focus vào stats và cộng pomodoro cho task đang chọn.
 *
 * `endedAt` phải truyền vào chứ không lấy `Date.now()`: phiên có thể đã kết thúc từ lâu mà
 * giờ mới được ghi (app ngủ qua mốc, hoặc phiên treo từ hôm trước). Mọi số liệu ở màn Record
 * chia theo ngày của `endedAt`, nên lấy "bây giờ" là đẩy công của hôm qua sang hôm nay.
 */
function logFocusSession(
  startedAt: number,
  endedAt: number,
  plannedMs: number,
  durationMs: number,
  done: boolean,
) {
  const { tasks, currentTaskId, incrementCompleted } = useTaskStore.getState();
  const task = tasks.find((t) => t.id === currentTaskId) ?? null;

  useStatsStore.getState().logSession({
    taskId: task?.id ?? null,
    taskName: task?.name ?? '',
    startedAt,
    endedAt,
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
      completedAt: null,
      pausedAt: null,
      endedTick: 0,

      sync: () => {
        const { status, endAt, phase } = get();
        // Màn Done không có đồng hồ nào chạy, nên đây là chỗ duy nhất hạn của nó được rà lại
        if (status === 'completed') {
          get().expireDone();
          return;
        }
        if (status === 'paused') {
          get().expirePaused();
          return;
        }
        if (status !== 'running' || endAt === null) return;

        const now = Date.now();
        if (now < endAt) {
          set({ remainingMs: endAt - now });
          return;
        }

        // App ngủ qua mốc kết thúc rồi mới mở lại cũng chạy vào đây, nhưng lúc đó thông
        // báo hệ thống đã kêu từ lâu — kêu thêm một tiếng ngay khi user mở app là thừa
        const fresh = now - endAt < FRESH_END_MS;

        if (phase === 'focus') {
          const { startedAt, plannedMs, endedTick } = get();
          logFocusSession(startedAt ?? endAt - plannedMs, endAt, plannedMs, plannedMs, true);
          set({
            status: 'completed',
            endAt: null,
            remainingMs: 0,
            lastSessionMs: plannedMs,
            // `endAt` chứ không phải `now`: phiên hết giờ lúc app đang ngủ thì `now` là lúc
            // user mở app lại, có thể đã sang hôm sau — lấy nó thì màn Done luôn "vừa mới"
            // và hạn ở trên không bao giờ tới.
            completedAt: endAt,
            pausedAt: null,
            endedTick: fresh ? endedTick + 1 : endedTick,
          });
          // Bật autoBreak thì vào nghỉ luôn, không dừng ở màn Done. Đặt sau `set()` để
          // phiên vừa xong đã ghi log và bắn tín hiệu chuông xong xuôi.
          if (useSettingsStore.getState().flags.autoBreak) {
            get().startBreak();
            return;
          }
          // Hết giờ từ lâu rồi mới mở app: màn Done quá hạn ngay lúc sinh ra. Rà ngay tại
          // đây — đợi nhịp `sync()` kế tiếp thì nó kịp loé lên một frame.
          get().expireDone();
          return;
        }

        // Hết giờ nghỉ. Nếu app ngủ qua mốc này thì phiên focus mới tính từ *bây giờ*,
        // không tính từ mốc cũ — nếu không user sẽ mở app ra và thấy phiên đã trôi mất.
        if (fresh) set({ endedTick: get().endedTick + 1 });
        get().skipBreak();
        if (useSettingsStore.getState().flags.autoStart) get().start();
      },

      start: () => {
        const { remainingMs, startedAt, phase } = get();
        set({
          status: 'running',
          endAt: Date.now() + remainingMs,
          startedAt: phase === 'focus' ? (startedAt ?? Date.now()) : startedAt,
          pausedAt: null,
        });
      },

      pause: () => {
        const { endAt, status } = get();
        if (status !== 'running' || endAt === null) return;
        set({
          status: 'paused',
          remainingMs: Math.max(0, endAt - Date.now()),
          endAt: null,
          pausedAt: Date.now(),
        });
      },

      toggle: () => {
        if (get().status === 'running') get().pause();
        else get().start();
      },

      endEarly: () => {
        const { status, endAt, remainingMs, plannedMs, startedAt } = get();
        const now = Date.now();
        const left =
          status === 'running' && endAt !== null ? Math.max(0, endAt - now) : remainingMs;
        const elapsed = Math.max(0, plannedMs - left);

        logFocusSession(startedAt ?? now - elapsed, now, plannedMs, elapsed, false);
        set({
          status: 'completed',
          endAt: null,
          remainingMs: 0,
          lastSessionMs: elapsed,
          completedAt: now,
          pausedAt: null,
        });
      },

      expireDone: () => {
        const { status, completedAt } = get();
        if (status !== 'completed') return;

        // Bản đã cài từ trước không lưu mốc này — coi như đã quá hạn, thà về nút Bắt đầu
        // còn hơn giữ lại một màn tổng kết không biết của phiên nào
        if (completedAt === null) {
          get().endSet();
          return;
        }

        const now = Date.now();
        const sameDay = getLocalDateStr(new Date(completedAt)) === getLocalDateStr(new Date(now));
        if (sameDay && now - completedAt < DONE_TTL_MS) return;

        // Còn trong ngày thì set vẫn đang dở: phiên nghỉ không ai bấm tính như đã nghỉ xong
        // nên sang phiên kế tiếp. Sang ngày mới thì set hôm qua đã đóng — về phiên 1.
        if (sameDay) get().skipBreak();
        else get().endSet();
      },

      expirePaused: () => {
        const { status, phase, pausedAt, startedAt, plannedMs, remainingMs } = get();
        if (status !== 'paused') return;

        const elapsed = Math.max(0, plannedMs - remainingMs);
        // Bản đã cài từ trước chưa lưu `pausedAt` — suy ra từ mốc bắt đầu phiên, ở đây chỉ
        // cần đúng *ngày* chứ không cần đúng phút. Không có cả hai thì để yên: một phiên
        // đang treo là thứ user chủ ý tạo ra, không tự tay bỏ khi còn mơ hồ.
        const stoppedAt = pausedAt ?? (startedAt !== null ? startedAt + elapsed : null);
        if (stoppedAt === null) return;

        const now = Date.now();
        // Còn trong ngày thì tạm dừng bao lâu cũng là chuyện của user — đi họp hai tiếng về
        // bấm Tiếp tục là quyền của họ. Chỉ sang ngày mới mới coi là đã bỏ.
        if (getLocalDateStr(new Date(stoppedAt)) === getLocalDateStr(new Date(now))) return;

        // Phiên nghỉ treo qua đêm thì không có gì để ghi — nghỉ không vào log
        if (phase === 'focus' && elapsed >= MIN_LOGGED_MS) {
          logFocusSession(startedAt ?? stoppedAt - elapsed, stoppedAt, plannedMs, elapsed, false);
        }
        get().endSet();
      },

      startBreak: () => {
        const { sessionNo } = get();
        const { sessionsPerSet, flags } = useSettingsStore.getState();
        // Basic mode không có set thì cũng không có "hết set" — mọi phiên nghỉ là nghỉ ngắn
        const phase: Phase =
          !flags.basicMode && sessionNo >= sessionsPerSet ? 'longBreak' : 'shortBreak';
        const planned = breakMsFor(phase);

        set({
          phase,
          status: 'running',
          plannedMs: planned,
          remainingMs: planned,
          endAt: Date.now() + planned,
          startedAt: null,
          completedAt: null,
          pausedAt: null,
        });
      },

      skipBreak: () => {
        const { phase, sessionNo } = get();
        const { sessionsPerSet, flags } = useSettingsStore.getState();
        const planned = focusMs();

        set({
          phase: 'focus',
          status: 'idle',
          plannedMs: planned,
          remainingMs: planned,
          endAt: null,
          startedAt: null,
          completedAt: null,
          pausedAt: null,
          // Sau nghỉ dài là hết set — quay về phiên 1. Basic mode thì đứng yên ở 1: không
          // đếm phiên nữa, và tắt công tắc đi cũng không thấy bộ đếm nhảy ra ở giữa set.
          sessionNo: flags.basicMode
            ? 1
            : phase === 'longBreak' || sessionNo >= sessionsPerSet
              ? 1
              : sessionNo + 1,
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
          completedAt: null,
          pausedAt: null,
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
      // `endedTick` cố tình không persist: nó là tín hiệu tức thời, không phải state cần
      // nhớ. Lưu xuống rồi thì lần mở app sau hook chime thấy số nhảy từ 0 lên giá trị
      // cũ và kêu oan một tiếng.
      partialize: (s) => ({
        phase: s.phase,
        status: s.status,
        endAt: s.endAt,
        remainingMs: s.remainingMs,
        plannedMs: s.plannedMs,
        startedAt: s.startedAt,
        sessionNo: s.sessionNo,
        lastSessionMs: s.lastSessionMs,
        completedAt: s.completedAt,
        pausedAt: s.pausedAt,
      }),
      // `sync()` ngay khi đọc xong state cũ: app có thể đã tắt suốt cả phiên.
      //
      // try/catch không phải cho vui: callback này chạy **bên trong** chuỗi promise
      // hydrate của persist, và một throw ở đây rơi vào nhánh `.catch` — nhánh đó không
      // đặt `hasHydrated` cũng không bắn `onFinishHydration`, nên cổng hydrate ở
      // `useStoresHydrated` treo vĩnh viễn và app đứng màn đen câm. Một phiên cũ tính
      // sai không đáng đổi bằng cả app.
      onRehydrateStorage: () => (state) => {
        try {
          state?.sync();
        } catch (e) {
          console.error('[timerStore] sync() lúc rehydrate thất bại', e);
        }
      },
    },
  ),
);
