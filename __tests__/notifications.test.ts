import * as Notifications from 'expo-notifications';
import { cancelSessionEnd, onSessionEndDelivered, scheduleSessionEnd } from '../utils/notifications';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 4, LOW: 2 },
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('scheduled-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn(),
}));

const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const receivedMock = Notifications.addNotificationReceivedListener as jest.Mock;

const T0 = 1_700_000_000_000;
const SESSION_MS = 25 * 60 * 1000;

let now = T0;

beforeEach(() => {
  now = T0;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  cancelMock.mockClear();
  receivedMock.mockReset();
  receivedMock.mockReturnValue({ remove: jest.fn() });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Listener mà `onSessionEndDelivered` vừa đăng ký với expo-notifications */
function registeredListener(): (event: unknown) => void {
  const listener = receivedMock.mock.calls[0]?.[0] as ((event: unknown) => void) | undefined;
  if (listener === undefined) throw new Error('chưa đăng ký listener nào');
  return listener;
}

/** Hình dạng tối thiểu của một notification được bắn tới, đủ cho nhánh lọc `kind` */
function delivered(kind: string): unknown {
  return { request: { content: { data: { kind } } } };
}

async function schedule() {
  await scheduleSessionEnd({
    endAt: now + SESSION_MS,
    title: 'Session done',
    body: 'take the break.',
    chime: true,
  });
}

describe('cancelSessionEnd — không được huỷ đúng lúc phiên vừa hết', () => {
  it('dừng giữa chừng thì huỷ lịch thật', async () => {
    await schedule();

    now += 9 * 60 * 1000; // user bấm pause ở phút thứ 9
    await cancelSessionEnd();

    expect(cancelMock).toHaveBeenCalledWith('scheduled-id');
  });

  it('đã qua mốc thì buông cho hệ điều hành bắn nốt', async () => {
    await schedule();

    // Đây là đường đi của phiên hết giờ tự nhiên: tick 500ms của useCountdown phát hiện
    // muộn hơn mốc một nhịp, useNotificationSync thấy status rời 'running' và gọi huỷ.
    // Huỷ ở đây là tự gỡ mất đúng cái thông báo vừa hẹn — trên Android 12+ alarm inexact
    // còn chưa kịp bắn.
    now += SESSION_MS + 400;
    await cancelSessionEnd();

    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('huỷ hai lần liên tiếp không gọi xuống native lần nào nữa', async () => {
    await schedule();

    now += 60 * 1000;
    await cancelSessionEnd();
    await cancelSessionEnd();

    expect(cancelMock).toHaveBeenCalledTimes(1);
  });
});

describe('onSessionEndDelivered — nhịp đồng hồ khi màn hình tắt', () => {
  it('chỉ đánh thức cho thông báo hết phiên', () => {
    const onEnd = jest.fn();
    onSessionEndDelivered(onEnd);

    // Đồng hồ thường trực được post lại nhiều lần trong một phiên, không phải tín hiệu gì
    registeredListener()(delivered('ongoing'));
    expect(onEnd).not.toHaveBeenCalled();

    registeredListener()(delivered('session-end'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('trả về hàm gỡ đăng ký để effect dọn được', () => {
    const remove = jest.fn();
    receivedMock.mockReturnValue({ remove });

    onSessionEndDelivered(jest.fn())();

    expect(remove).toHaveBeenCalled();
  });
});
