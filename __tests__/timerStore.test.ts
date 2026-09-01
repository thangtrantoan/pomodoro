import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';
import { useTaskStore } from '../store/taskStore';
import { minutesToMs } from '../utils/time';

const FOCUS = minutesToMs(25);
const T0 = 1_700_000_000_000;

let now = T0;

beforeEach(() => {
  now = T0;
  jest.spyOn(Date, 'now').mockImplementation(() => now);

  useSettingsStore.setState({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsPerSet: 4,
    flags: { autoStart: true, autoBreak: false, chime: true, ongoing: true, keepAwake: true },
  });
  useStatsStore.setState({ sessions: [] });
  useTaskStore.setState({ tasks: [], currentTaskId: null });
  useTimerStore.setState({
    phase: 'focus',
    status: 'idle',
    endAt: null,
    remainingMs: FOCUS,
    plannedMs: FOCUS,
    startedAt: null,
    sessionNo: 1,
    lastSessionMs: 0,
    endedTick: 0,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Giả lập thời gian trôi mà KHÔNG chạy tick nào — đúng cảnh app bị đưa xuống nền */
function advance(ms: number) {
  now += ms;
}

describe('timerStore — đồng hồ theo mốc tuyệt đối', () => {
  it('start() đặt endAt theo thời gian còn lại', () => {
    useTimerStore.getState().start();
    const s = useTimerStore.getState();
    expect(s.status).toBe('running');
    expect(s.endAt).toBe(T0 + FOCUS);
  });

  it('sync() bù đủ thời gian app ngủ, không phụ thuộc số lần tick', () => {
    useTimerStore.getState().start();

    // App xuống nền 10 phút, không có tick nào chạy
    advance(minutesToMs(10));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().remainingMs).toBe(minutesToMs(15));
  });

  it('pause() giữ nguyên thời gian còn lại và bỏ endAt', () => {
    useTimerStore.getState().start();
    advance(minutesToMs(4));
    useTimerStore.getState().pause();

    const s = useTimerStore.getState();
    expect(s.status).toBe('paused');
    expect(s.remainingMs).toBe(minutesToMs(21));
    expect(s.endAt).toBeNull();

    // Đang tạm dừng thì thời gian trôi không ăn vào đồng hồ
    advance(minutesToMs(30));
    useTimerStore.getState().sync();
    expect(useTimerStore.getState().remainingMs).toBe(minutesToMs(21));
  });

  it('phiên hết giờ lúc app đang ngủ vẫn được ghi log khi mở lại', () => {
    useTaskStore.setState({
      tasks: [{ id: 't1', name: 'Task', completed: 0, createdAt: T0, archived: false }],
      currentTaskId: 't1',
    });

    useTimerStore.getState().start();
    advance(FOCUS + minutesToMs(40)); // mở lại app rất lâu sau khi hết giờ
    useTimerStore.getState().sync();

    const timer = useTimerStore.getState();
    expect(timer.status).toBe('completed');
    expect(timer.remainingMs).toBe(0);
    expect(timer.lastSessionMs).toBe(FOCUS);

    const sessions = useStatsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].durationMs).toBe(FOCUS);
    // Pomodoro được cộng cho đúng task đang chọn
    expect(useTaskStore.getState().tasks[0].completed).toBe(1);
  });

  it('endEarly() ghi phiên chưa hoàn thành với thời gian đã ngồi thật', () => {
    useTimerStore.getState().start();
    advance(minutesToMs(9));
    useTimerStore.getState().endEarly();

    const sessions = useStatsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(false);
    expect(sessions[0].durationMs).toBe(minutesToMs(9));
    expect(useTimerStore.getState().status).toBe('completed');
  });
});

describe('timerStore — vòng phiên trong set', () => {
  it('phiên 1..3 dùng nghỉ ngắn', () => {
    useTimerStore.setState({ sessionNo: 2 });
    useTimerStore.getState().startBreak();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('shortBreak');
    expect(s.plannedMs).toBe(minutesToMs(5));
  });

  it('phiên cuối set dùng nghỉ dài', () => {
    useTimerStore.setState({ sessionNo: 4 });
    useTimerStore.getState().startBreak();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('longBreak');
    expect(s.plannedMs).toBe(minutesToMs(15));
  });

  it('hết nghỉ ngắn thì sang phiên kế tiếp', () => {
    useTimerStore.setState({ sessionNo: 2, phase: 'shortBreak' });
    useTimerStore.getState().skipBreak();

    const s = useTimerStore.getState();
    expect(s.sessionNo).toBe(3);
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(FOCUS);
  });

  it('hết nghỉ dài thì quay về phiên 1 của set mới', () => {
    useTimerStore.setState({ sessionNo: 4, phase: 'longBreak' });
    useTimerStore.getState().skipBreak();
    expect(useTimerStore.getState().sessionNo).toBe(1);
  });

  it('bật autoStart thì hết nghỉ là chạy tiếp luôn', () => {
    useTimerStore.setState({ sessionNo: 1, phase: 'shortBreak' });
    useTimerStore.getState().startBreak();

    advance(minutesToMs(6));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('running');
    // Phiên mới tính từ lúc mở lại app, không phải từ mốc hết nghỉ đã trôi qua
    expect(s.endAt).toBe(now + FOCUS);
  });

  it('tắt autoStart thì hết nghỉ chỉ dừng ở trạng thái sẵn sàng', () => {
    useSettingsStore.setState({
      flags: { autoStart: false, autoBreak: false, chime: true, ongoing: true, keepAwake: true },
    });
    useTimerStore.setState({ sessionNo: 1 });
    useTimerStore.getState().startBreak();

    advance(minutesToMs(6));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('bật autoBreak thì hết phiên focus là vào nghỉ luôn, không qua màn tổng kết', () => {
    useSettingsStore.setState({
      flags: { autoStart: true, autoBreak: true, chime: true, ongoing: true, keepAwake: true },
    });
    useTimerStore.getState().start();

    advance(FOCUS + 400);
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('shortBreak');
    expect(s.status).toBe('running');
    expect(s.endAt).toBe(now + minutesToMs(5));
    // Bỏ qua màn Done nhưng phiên vẫn phải được ghi log đầy đủ
    expect(useStatsStore.getState().sessions).toHaveLength(1);
  });
});

describe('timerStore — tín hiệu chuông hết phiên', () => {
  it('hết giờ trong lúc app đang mở thì bắn tín hiệu', () => {
    useTimerStore.getState().start();

    // Tick 500ms của useCountdown phát hiện muộn hơn mốc một nhịp
    advance(FOCUS + 400);
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().endedTick).toBe(1);
  });

  it('app ngủ qua mốc rồi mới mở lại thì không bắn — thông báo hệ thống đã kêu rồi', () => {
    useTimerStore.getState().start();

    advance(FOCUS + minutesToMs(40));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('completed');
    expect(s.endedTick).toBe(0);
  });

  it('kết thúc sớm là chủ ý của user, không bắn chuông', () => {
    useTimerStore.getState().start();
    advance(minutesToMs(9));
    useTimerStore.getState().endEarly();

    expect(useTimerStore.getState().endedTick).toBe(0);
  });

  it('hết giờ nghỉ cũng bắn tín hiệu', () => {
    useTimerStore.setState({ sessionNo: 1 });
    useTimerStore.getState().startBreak();

    advance(minutesToMs(5) + 300);
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().endedTick).toBe(1);
  });

  it('là số đếm nên hai phiên liên tiếp bắn hai lần phân biệt được', () => {
    useTimerStore.getState().start();
    advance(FOCUS + 100);
    useTimerStore.getState().sync();

    useTimerStore.getState().startBreak();
    advance(minutesToMs(5) + 100);
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().endedTick).toBe(2);
  });
});

describe('timerStore — đổi độ dài phiên', () => {
  it('áp ngay khi đồng hồ đang rảnh', () => {
    useSettingsStore.setState({ focusMinutes: 45 });
    useTimerStore.getState().applyFocusLength();
    expect(useTimerStore.getState().remainingMs).toBe(minutesToMs(45));
  });

  it('không cắt ngang phiên đang chạy', () => {
    useTimerStore.getState().start();
    useSettingsStore.setState({ focusMinutes: 45 });
    useTimerStore.getState().applyFocusLength();
    expect(useTimerStore.getState().plannedMs).toBe(FOCUS);
  });
});
