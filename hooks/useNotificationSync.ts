import { useEffect } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useT } from './useT';
import { formatClock } from '../utils/time';
import {
  cancelSessionEnd,
  clearOngoing,
  configureNotificationHandler,
  ensurePermissions,
  scheduleSessionEnd,
  sessionEndCopy,
  showOngoing,
} from '../utils/notifications';

/** Nối vòng đời notification vào timer store — gắn một lần ở root layout */
export function useNotificationSync(): void {
  const t = useT();
  const status = useTimerStore((s) => s.status);
  const phase = useTimerStore((s) => s.phase);
  const endAt = useTimerStore((s) => s.endAt);
  const remainingMs = useTimerStore((s) => s.remainingMs);
  const chime = useSettingsStore((s) => s.flags.chime);
  const ongoing = useSettingsStore((s) => s.flags.ongoing);
  const tasks = useTaskStore((s) => s.tasks);
  const currentTaskId = useTaskStore((s) => s.currentTaskId);

  const taskName = tasks.find((task) => task.id === currentTaskId)?.name ?? t.timer.noTask;

  useEffect(() => {
    configureNotificationHandler();
    void ensurePermissions();
  }, []);

  // Hẹn tiếng báo đúng mốc kết thúc; pause/kết thúc sớm thì huỷ lịch
  useEffect(() => {
    if (status !== 'running' || endAt === null) {
      void cancelSessionEnd();
      return;
    }
    const { title, body } = sessionEndCopy(phase, t.notification, taskName);
    void scheduleSessionEnd({ endAt, title, body, chime });
  }, [status, phase, endAt, chime, taskName, t.notification]);

  // Đồng hồ thường trực — chỉ cập nhật mỗi khi đổi phút, không phải mỗi giây
  const minuteMark = Math.ceil(remainingMs / 60000);
  useEffect(() => {
    if (!ongoing || status !== 'running' || phase !== 'focus') {
      void clearOngoing();
      return;
    }
    void showOngoing(
      t.notification.ongoing,
      t.notification.ongoingBody(formatClock(remainingMs), taskName),
    );
    // `remainingMs` cố tình không nằm trong deps: chỉ vẽ lại khi `minuteMark` đổi,
    // nếu không sẽ ghi đè notification mỗi 500ms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongoing, status, phase, minuteMark, taskName, t.notification]);

  // Rời app / tắt timer thì dọn đồng hồ thường trực
  useEffect(() => clearOngoingOnUnmount, []);
}

function clearOngoingOnUnmount() {
  void clearOngoing();
}
