import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Phase } from '../types';

/**
 * Local notification — không có push/remote ở app này.
 *
 * Đây là bản dựng thật của artboard "Lock screen widget" trong design: Expo managed không
 * cài được widget màn khoá, nhưng một *ongoing notification* (Android `sticky`) hiện đúng
 * chỗ đó với thời gian còn lại và tên việc.
 */

/** Kênh cho tiếng báo hết phiên — importance cao để hiện được heads-up */
const CHANNEL_ALERT = 'interval-session-end';
/** Kênh cho đồng hồ thường trực — LOW để không kêu mỗi lần cập nhật */
const CHANNEL_ONGOING = 'interval-ongoing';

/** Id cố định: mỗi lần cập nhật là ghi đè, không đẻ thêm thông báo mới */
const ONGOING_ID = 'interval-ongoing-timer';

let handlerConfigured = false;

/**
 * Không set handler thì expo-notifications mặc định **không hiện lẫn không phát âm
 * thanh** bất kỳ notification nào trong khi JS thread còn sống — kể cả app đang chạy
 * nền (chưa bị kill hẳn), không chỉ lúc foreground. Thiếu dòng này là lý do đồng hồ
 * thường trực không hiện và tiếng báo hết phiên im lặng, dù lịch đã hẹn đúng.
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let channelsReady = false;

export async function ensureChannels(): Promise<void> {
  if (channelsReady || Platform.OS !== 'android') {
    channelsReady = true;
    return;
  }
  await Notifications.setNotificationChannelAsync(CHANNEL_ALERT, {
    name: 'Session end',
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_ONGOING, {
    name: 'Running timer',
    importance: Notifications.AndroidImportance.LOW,
    // Đồng hồ chạy nền không nên rung/kêu mỗi lần đổi số
    enableVibrate: false,
    showBadge: false,
  });
  channelsReady = true;
}

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/** Id của thông báo hết phiên đang hẹn — huỷ khi user pause hoặc kết thúc sớm */
let scheduledEndId: string | null = null;

export async function cancelSessionEnd(): Promise<void> {
  if (scheduledEndId === null) return;
  const id = scheduledEndId;
  scheduledEndId = null;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/**
 * Hẹn thông báo đúng mốc `endAt`. Hẹn theo DATE trigger chứ không setTimeout — hệ điều
 * hành sẽ bắn kể cả khi app đã bị kill.
 */
export async function scheduleSessionEnd(opts: {
  endAt: number;
  title: string;
  body: string;
  chime: boolean;
}): Promise<void> {
  await cancelSessionEnd();
  if (opts.endAt <= Date.now()) return;

  await ensureChannels();
  scheduledEndId = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: opts.chime,
      data: { kind: 'session-end' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(opts.endAt),
      channelId: CHANNEL_ALERT,
    },
  });
}

/**
 * Đồng hồ thường trực khi đang tập trung. Chỉ Android — iOS không cho app quản lý
 * một notification không thể vuốt bỏ (Live Activity cần code native).
 */
export async function showOngoing(title: string, body: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: ONGOING_ID,
    content: {
      title,
      body,
      sticky: true,
      sound: false,
      autoDismiss: false,
      data: { kind: 'ongoing' },
    },
    trigger: null,
  });
}

export async function clearOngoing(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.dismissNotificationAsync(ONGOING_ID).catch(() => {});
}

/** Tiêu đề/nội dung thông báo hết phiên tuỳ theo loại phiên vừa xong */
export function sessionEndCopy(
  phase: Phase,
  t: {
    focusDone: string;
    focusDoneBody: (task: string) => string;
    breakDone: string;
    breakDoneBody: string;
  },
  taskName: string,
): { title: string; body: string } {
  return phase === 'focus'
    ? { title: t.focusDone, body: t.focusDoneBody(taskName) }
    : { title: t.breakDone, body: t.breakDoneBody };
}
