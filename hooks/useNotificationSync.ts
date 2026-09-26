import { useEffect } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useT } from './useT';
import { useSoundActive } from './useSoundActive';
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
  const notify = useSettingsStore((s) => s.flags.notify);
  const chime = useSettingsStore((s) => s.flags.chime);
  const ongoing = useSettingsStore((s) => s.flags.ongoing);
  const basicMode = useSettingsStore((s) => s.flags.basicMode);
  // Có tiếng đang phát là player đã dựng một media notification không tắt được — hiện thêm
  // đồng hồ thường trực là hai dòng của cùng một app chồng nhau. Chỉ còn một nguồn âm thanh
  // nên chỉ còn một câu để hỏi.
  const playerTakesOver = useSoundActive();
  const tasks = useTaskStore((s) => s.tasks);
  const currentTaskId = useTaskStore((s) => s.currentTaskId);

  // Basic mode ẩn hẳn phần việc cần làm, nên thông báo cũng không được nhắc tới nó —
  // `null` là "không có chuyện việc cần làm ở đây", khác với "chưa chọn việc nào"
  const taskName = basicMode
    ? null
    : (tasks.find((task) => task.id === currentTaskId)?.name ?? t.timer.noTask);

  useEffect(() => {
    configureNotificationHandler();
    void ensurePermissions();
  }, []);

  // Hẹn tiếng báo đúng mốc kết thúc; pause/kết thúc sớm thì huỷ lịch.
  //
  // `notify` tắt là không hẹn gì cả — kèm hệ quả: mất luôn `onSessionEndDelivered` bên
  // dưới, cú đánh thức native duy nhất khi màn hình tắt mà không bật nhạc nền. Hint của
  // công tắc trong Settings nói đúng chuyện này.
  useEffect(() => {
    if (!notify || status !== 'running' || endAt === null) {
      void cancelSessionEnd();
      return;
    }
    const { title, body } = sessionEndCopy(phase, t.notification, taskName);
    void scheduleSessionEnd({ endAt, title, body, chime });
  }, [notify, status, phase, endAt, chime, taskName, t.notification]);

  // Đồng hồ thường trực — nội dung tĩnh, không kèm số phút còn lại nên không cần
  // post lại mỗi phút (tránh notification "nhảy" liên tục). Đếm ngược chính xác xem
  // trong app.
  //
  // Có tiếng thì nhường chỗ: foreground service của expo-audio đã dựng sẵn một media
  // notification không tắt được, hiện thêm cái này nữa là hai dòng của cùng một app chồng
  // nhau trên màn khoá. Media notification còn hơn ở chỗ có nút play/pause thật.
  useEffect(() => {
    if (!ongoing || playerTakesOver || status !== 'running' || phase !== 'focus') {
      void clearOngoing();
      return;
    }
    void showOngoing(
      t.notification.ongoing,
      taskName === null ? t.notification.ongoingBodyPlain : t.notification.ongoingBody(taskName),
    );
  }, [ongoing, playerTakesOver, status, phase, taskName, t.notification]);

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
