import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
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
 *
 * ## Vì sao phải tắt tiếng khi app đang mở
 *
 * App có **hai** tiếng báo hết phiên, cố ý: `useSessionChime` phát `chime.wav` từ trong
 * app (chắc chắn kêu khi app mở, không phụ thuộc quyền hay alarm), còn notification lo
 * trường hợp màn hình đã tắt. Nhưng `cancelSessionEnd` không huỷ lịch khi đã qua mốc hẹn
 * — đúng lúc hết giờ tự nhiên — nên khi app đang mở thì **cả hai** cùng kêu, lệch nhau
 * đúng bằng độ trễ của alarm. Nghe ra hai tiếng đè nhau ở mọi mốc chuyển phiên.
 *
 * Nên chọn một: app `active` thì chuông trong app là tiếng chính, notification im (banner
 * vẫn hiện — nó nói phiên nào vừa xong). Ra khỏi foreground thì ngược lại, notification là
 * tiếng duy nhất còn lại.
 *
 * Chỉ coi `'active'` là foreground, không gộp `'inactive'`: `'inactive'` của iOS là trạng
 * thái quá độ (vuốt notification center xuống chẳng hạn), không chắc chuông trong app kịp
 * kêu — thà nghe thừa một tiếng còn hơn im hẳn ở mốc hết phiên.
 *
 * Cờ `chime` tắt thì cả hai đều im sẵn: `scheduleSessionEnd` đã truyền `sound: false`.
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: AppState.currentState !== 'active',
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
/** Mốc đã hẹn của `scheduledEndId` — để biết lịch đó còn "chưa tới" hay đã tới hạn */
let scheduledEndAt: number | null = null;

/**
 * Huỷ lịch báo hết phiên — nhưng **không** huỷ khi đã tới mốc đã hẹn.
 *
 * Hết giờ tự nhiên cũng chính là lúc `status` rời khỏi `'running'`, nên huỷ vô điều kiện
 * là app tự tay gỡ đúng cái thông báo nó vừa hẹn: tick 500ms của `useCountdown` phát hiện
 * hết giờ rồi `useNotificationSync` gọi vào đây, tất cả xảy ra trong vòng nửa giây sau
 * `endAt`. Hệ điều hành thường chưa kịp bắn alarm trong khoảng đó — trên Android 12+ mà
 * thiếu quyền `SCHEDULE_EXACT_ALARM` thì expo-notifications rơi xuống alarm inexact
 * (`setAndAllowWhileIdle`), trễ vài giây tới vài phút — nên app luôn thắng cuộc đua và
 * không bao giờ có tiếng nào.
 *
 * Đã qua mốc thì buông cho hệ điều hành bắn nốt, chỉ quên id đi.
 */
export async function cancelSessionEnd(): Promise<void> {
  if (scheduledEndId === null) return;
  const id = scheduledEndId;
  const dueAt = scheduledEndAt;
  scheduledEndId = null;
  scheduledEndAt = null;
  if (dueAt !== null && Date.now() >= dueAt) return;
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
  scheduledEndAt = opts.endAt;
}

/**
 * Chạy `callback` mỗi lần thông báo hết phiên được hệ điều hành bắn ra, kèm hàm gỡ đăng ký.
 *
 * Đây là cú đánh thức duy nhất từ native khi user **không bật nhạc nền**: lúc màn hình
 * tắt thì React Native đã gỡ hết JS timer, `useCountdown` đứng hình, không có gì phát
 * hiện ra phiên đã hết. Alarm bắn thì receiver của expo-notifications chạy trong đúng
 * process này và đẩy sự kiện lên JS — bám vào đó để `sync()` một nhịp.
 *
 * Lọc theo `kind` để bỏ qua thông báo đồng hồ thường trực, thứ được post lại nhiều lần
 * trong một phiên.
 */
export function onSessionEndDelivered(callback: () => void): () => void {
  const sub = Notifications.addNotificationReceivedListener((event) => {
    if (event.request.content.data.kind === 'session-end') callback();
  });
  return () => sub.remove();
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

/**
 * Tiêu đề/nội dung thông báo hết phiên tuỳ theo loại phiên vừa xong.
 *
 * `taskName === null` là chế độ basic: không có việc nào để nhắc, nên dùng câu không có
 * chỗ cắm tên việc — chứ không nhét chuỗi rỗng hay "Chưa chọn việc" vào câu cũ.
 */
export function sessionEndCopy(
  phase: Phase,
  t: {
    focusDone: string;
    focusDoneBody: (task: string) => string;
    focusDoneBodyPlain: string;
    breakDone: string;
    breakDoneBody: string;
  },
  taskName: string | null,
): { title: string; body: string } {
  if (phase !== 'focus') return { title: t.breakDone, body: t.breakDoneBody };
  return {
    title: t.focusDone,
    body: taskName === null ? t.focusDoneBodyPlain : t.focusDoneBody(taskName),
  };
}
