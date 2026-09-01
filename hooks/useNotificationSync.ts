import { useEffect } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useT } from './useT';
import { useMusicActive } from './useMusicActive';
import {
  cancelSessionEnd,
  clearOngoing,
  configureNotificationHandler,
  ensurePermissions,
  onSessionEndDelivered,
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
  const chime = useSettingsStore((s) => s.flags.chime);
  const ongoing = useSettingsStore((s) => s.flags.ongoing);
  const musicActive = useMusicActive();
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

  // Đồng hồ thường trực — nội dung tĩnh, không kèm số phút còn lại nên không cần
  // post lại mỗi phút (tránh notification "nhảy" liên tục). Đếm ngược chính xác xem
  // trong app.
  //
  // Nhạc đang phát thì nhường chỗ: foreground service của expo-audio đã dựng sẵn một
  // media notification không tắt được, hiện thêm cái này nữa là hai dòng của cùng một app
  // chồng nhau trên màn khoá. Media notification còn hơn ở chỗ có nút play/pause thật.
  useEffect(() => {
    if (!ongoing || musicActive || status !== 'running' || phase !== 'focus') {
      void clearOngoing();
      return;
    }
    void showOngoing(t.notification.ongoing, t.notification.ongoingBody(taskName));
  }, [ongoing, musicActive, status, phase, taskName, t.notification]);

  // Thông báo hết phiên bắn ra là một cú đánh thức từ native, không đi qua JS timer —
  // dùng luôn làm nhịp cho trường hợp tắt màn hình mà không bật nhạc nền. Không có nó
  // thì phiên chỉ thật sự kết thúc lúc user mở lại app.
  useEffect(() => onSessionEndDelivered(() => useTimerStore.getState().sync()), []);

  // Rời app / tắt timer thì dọn đồng hồ thường trực
  useEffect(() => clearOngoingOnUnmount, []);
}

function clearOngoingOnUnmount() {
  void clearOngoing();
}
