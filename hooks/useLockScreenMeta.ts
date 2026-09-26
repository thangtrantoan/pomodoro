import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useTimerStore } from '../store/timerStore';
import { useT } from './useT';

/**
 * Hai dòng trên của media notification, dùng chung cho mọi player có thể giữ màn khoá
 * (nhạc nền hoặc tiếng tick — xem `useTickOwnsLockScreen`).
 *
 * Tách ra vì cả hai phải nói **cùng một câu**: đó là notification của cùng một app, và chỉ
 * một trong hai hiện ra tuỳ cấu hình. Để mỗi hook tự ghép chuỗi là sớm muộn hai chỗ lệch
 * nhau, mà user thì không có cách nào biết vì họ chỉ thấy một cái.
 *
 *     title  -> setContentTitle "Phiên 2 / 4"       (basic mode: "Đang tập trung")
 *     artist -> setContentText  "Viết báo cáo quý 3" (basic mode: rỗng)
 *
 * Cố ý **không** đếm ngược: mỗi lần đổi metadata là post lại cả notification, làm mỗi giây
 * thì vừa nhấp nháy vừa tốn pin. Đếm ngược chính xác xem trong app.
 */
export function useLockScreenMeta(): { title: string; artist: string } {
  const t = useT();
  const sessionNo = useTimerStore((s) => s.sessionNo);
  const sessionsPerSet = useSettingsStore((s) => s.sessionsPerSet);
  const basicMode = useSettingsStore((s) => s.flags.basicMode);
  const tasks = useTaskStore((s) => s.tasks);
  const currentTaskId = useTaskStore((s) => s.currentTaskId);

  // Basic mode không có hai thứ này — không đếm phiên, không việc cần làm — nên lùi về
  // trạng thái đồng hồ và bỏ trống dòng dưới, thay vì in ra đúng cái chế độ đó vừa ẩn đi
  if (basicMode) return { title: t.timer.focusing, artist: '' };

  return {
    title: t.timer.session(sessionNo, sessionsPerSet),
    artist: tasks.find((task) => task.id === currentTaskId)?.name ?? t.timer.noTask,
  };
}
