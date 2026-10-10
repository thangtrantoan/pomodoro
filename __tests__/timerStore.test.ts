import { useTimerStore } from '../store/timerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';
import { useTaskStore } from '../store/taskStore';
import { minutesToMs } from '../utils/time';
import type { Flags } from '../types';

const FOCUS = minutesToMs(25);
const T0 = 1_700_000_000_000;

/**
 * Mọi test về "hết hạn" phải mốc từ một giờ giữa ngày, không dùng `T0`: ở một số múi giờ
 * `T0` rơi vào quãng 23:xx và mấy chục phút trôi trong test sẽ lén bước sang ngày mới, làm
 * test đỏ ở máy này mà xanh ở máy khác.
 */
const NINE_AM = new Date(2023, 10, 15, 9, 0).getTime();
/** Sáng hôm sau — cho các test "treo qua đêm" */
const NEXT_MORNING = new Date(2023, 10, 16, 8, 0).getTime();

/**
 * Mốc cờ mặc định cho mọi test. Các test chỉ ghi đè cờ chúng quan tâm qua `setFlags` —
 * viết cả object ra từng chỗ là thêm một cờ mới thì ba chỗ cùng đỏ, mà chẳng test nào
 * trong số đó nói về cờ mới.
 */
const BASE_FLAGS: Flags = {
  basicMode: false,
  autoStart: true,
  autoBreak: false,
  notify: true,
  chime: true,
  ongoing: true,
  keepAwake: true,
};

function setFlags(overrides: Partial<Flags>) {
  useSettingsStore.setState({ flags: { ...BASE_FLAGS, ...overrides } });
}

let now = T0;

beforeEach(() => {
  now = T0;
  jest.spyOn(Date, 'now').mockImplementation(() => now);

  useSettingsStore.setState({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsPerSet: 4,
    flags: BASE_FLAGS,
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
    completedAt: null,
    pausedAt: null,
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
    advance(FOCUS + minutesToMs(5)); // mở lại app sau khi hết giờ, chưa quá hạn màn Done
    useTimerStore.getState().sync();

    const timer = useTimerStore.getState();
    expect(timer.status).toBe('completed');
    expect(timer.remainingMs).toBe(0);
    expect(timer.lastSessionMs).toBe(FOCUS);

    const sessions = useStatsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].durationMs).toBe(FOCUS);
    // Ghi theo mốc hết giờ thật, không phải lúc user mở app lại — nếu không thì phiên của
    // hôm qua bị tính vào "Tập trung hôm nay"
    expect(sessions[0].endedAt).toBe(T0 + FOCUS);
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
    setFlags({ autoStart: false });
    useTimerStore.setState({ sessionNo: 1 });
    useTimerStore.getState().startBreak();

    advance(minutesToMs(6));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('bật autoBreak thì hết phiên focus là vào nghỉ luôn, không qua màn tổng kết', () => {
    setFlags({ autoBreak: true });
    useTimerStore.getState().start();
    const focusEnd = now + FOCUS;

    advance(FOCUS + 400);
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('shortBreak');
    expect(s.status).toBe('running');
    // Mốc hết nghỉ tính từ lúc phiên focus hết, không phải từ lúc `sync()` phát hiện ra:
    // tick 500ms nên hai mốc đó luôn lệch nhau một chút, và giờ nghỉ phải trôi theo đồng
    // hồ thật. Xem test "mở app giữa khoảng nghỉ" cho trường hợp lệch nhiều.
    expect(s.endAt).toBe(focusEnd + minutesToMs(5));
    // Bỏ qua màn Done nhưng phiên vẫn phải được ghi log đầy đủ
    expect(useStatsStore.getState().sessions).toHaveLength(1);
  });
});

describe('timerStore — mốc chuyển phiên đã trôi qua lúc app ngủ', () => {
  it('autoBreak: mở app giữa khoảng nghỉ thì chỉ còn phần nghỉ chưa trôi', () => {
    setFlags({ autoBreak: true });
    useTimerStore.getState().start();
    const focusEnd = now + FOCUS;

    // Phiên hết giờ lúc app đang nền, user mở lại sau 2 phút
    advance(FOCUS + minutesToMs(2));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('shortBreak');
    expect(s.status).toBe('running');
    // Giờ nghỉ trôi theo đồng hồ thật: hết lúc 9:30, không phải 9:32
    expect(s.endAt).toBe(focusEnd + minutesToMs(5));
    expect(s.remainingMs).toBe(minutesToMs(3));
    // Vòng tiến trình phải thấy giờ nghỉ đã chạy được 2/5
    expect(s.plannedMs).toBe(minutesToMs(5));
  });

  it('autoBreak: ngủ qua hết khoảng nghỉ thì không dựng phiên nghỉ mới, về màn tổng kết', () => {
    setFlags({ autoBreak: true });
    useTimerStore.getState().start();

    // Hết phiên lúc 9:25, giờ nghỉ đáng ra tới 9:30 — user mở app lúc 9:35
    advance(FOCUS + minutesToMs(10));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('completed');
    expect(s.endAt).toBeNull();
    expect(useStatsStore.getState().sessions).toHaveLength(1);
  });

  it('autoBreak: ngủ qua đêm thì về phiên 1 sẵn sàng, không nghỉ cũng không chạy', () => {
    setFlags({ autoBreak: true });
    now = NINE_AM;
    useTimerStore.setState({ sessionNo: 3 });
    useTimerStore.getState().start();

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.sessionNo).toBe(1);
  });

  it('autoStart: hết nghỉ từ đêm qua thì không tự chạy phiên mới', () => {
    now = NINE_AM;
    useTimerStore.getState().startBreak();

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(FOCUS);
  });

  it('autoStart: hết nghỉ vài phút trước thì vẫn chạy tiếp — mốc còn ấm', () => {
    now = NINE_AM;
    useTimerStore.getState().startBreak();

    advance(minutesToMs(6));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('running');
  });
});

describe('timerStore — chế độ basic (không set, không phiên)', () => {
  it('phiên cuối set vẫn chỉ là nghỉ ngắn', () => {
    setFlags({ basicMode: true });
    useTimerStore.setState({ sessionNo: 4 });
    useTimerStore.getState().startBreak();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('shortBreak');
    expect(s.plannedMs).toBe(minutesToMs(5));
  });

  it('bật autoBreak cũng không vào nghỉ — hết phiên là dừng ở màn tổng kết', () => {
    setFlags({ basicMode: true, autoBreak: true });
    useTimerStore.getState().start();

    advance(FOCUS + 400);
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('completed');
    expect(s.phase).toBe('focus');
    expect(s.endAt).toBeNull();
    // Phiên vẫn phải được ghi log đầy đủ như mọi phiên hết giờ khác
    expect(useStatsStore.getState().sessions).toHaveLength(1);
  });

  it('gạt công tắc lên giữa một phiên nghỉ đang đếm thì cắt phiên nghỉ đó', () => {
    useTimerStore.getState().startBreak();
    expect(useTimerStore.getState().phase).toBe('shortBreak');

    setFlags({ basicMode: true });
    useTimerStore.getState().applyBasicMode();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(FOCUS);
  });

  it('không bật basic thì applyBasicMode() không chạm vào phiên nghỉ', () => {
    useTimerStore.getState().startBreak();
    useTimerStore.getState().applyBasicMode();

    expect(useTimerStore.getState().phase).toBe('shortBreak');
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('hết nghỉ không đếm sang phiên kế tiếp', () => {
    setFlags({ basicMode: true });
    useTimerStore.setState({ sessionNo: 1, phase: 'shortBreak' });
    useTimerStore.getState().skipBreak();

    const s = useTimerStore.getState();
    expect(s.sessionNo).toBe(1);
    expect(s.phase).toBe('focus');
    expect(s.remainingMs).toBe(FOCUS);
  });

  it('đang ở giữa set rồi bật basic thì bộ đếm về 1 sau phiên nghỉ kế tiếp', () => {
    // Tắt công tắc đi mà `sessionNo` còn đứng ở 3 thì user thấy "Phiên 3 / 4" nhảy ra
    // giữa không khí — không có phiên 1, 2 nào cả
    setFlags({ basicMode: true });
    useTimerStore.setState({ sessionNo: 3, phase: 'shortBreak' });
    useTimerStore.getState().skipBreak();

    expect(useTimerStore.getState().sessionNo).toBe(1);
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

    advance(FOCUS + minutesToMs(5));
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

describe('timerStore — hạn của màn tổng kết phiên', () => {
  beforeEach(() => {
    now = NINE_AM;
  });

  /** Đưa store về đúng trạng thái "vừa xong phiên, đang ở màn Done" */
  function completeSession() {
    useTimerStore.getState().start();
    advance(FOCUS + 400);
    useTimerStore.getState().sync();
    expect(useTimerStore.getState().status).toBe('completed');
  }

  it('mở lại app ngay sau phiên thì màn Done còn nguyên', () => {
    completeSession();

    // Đi nghỉ 15 phút rồi mở app lại — nút "Nghỉ" phải còn đó
    advance(minutesToMs(15));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('completed');
  });

  it('quá hạn trong cùng ngày thì về trạng thái sẵn sàng của phiên kế tiếp', () => {
    useTimerStore.setState({ sessionNo: 2 });
    completeSession();

    advance(minutesToMs(31));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.phase).toBe('focus');
    expect(s.remainingMs).toBe(FOCUS);
    // Phiên nghỉ không ai bấm tính như đã nghỉ xong
    expect(s.sessionNo).toBe(3);
  });

  it('quá hạn không tự chạy phiên mới dù bật autoStart — user phải tự bấm Bắt đầu', () => {
    completeSession();

    advance(minutesToMs(45));
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('hết giờ lúc app đang ngủ quá lâu thì mở app ra thấy nút Bắt đầu, không phải tổng kết', () => {
    useTimerStore.getState().start();

    // Phiên hết giờ lúc 9:25, user mở app lại lúc 11:00 — nút "Nghỉ 5 phút" lúc này vô nghĩa
    advance(FOCUS + minutesToMs(95));
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionNo).toBe(2);

    // Bỏ màn tổng kết nhưng phiên vẫn phải được ghi, và ghi theo mốc hết giờ thật
    const sessions = useStatsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].endedAt).toBe(NINE_AM + FOCUS);
  });

  it('sang ngày mới thì hết hạn ngay cả khi chưa đủ 30 phút, và set về phiên 1', () => {
    const lateNight = new Date(2023, 10, 15, 23, 55).getTime();
    useTimerStore.setState({ status: 'completed', completedAt: lateNight, sessionNo: 2 });

    now = lateNight + minutesToMs(10); // 00:05 hôm sau — mới 10 phút nhưng đã khác ngày
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionNo).toBe(1);
  });

  it('bản cũ chưa lưu mốc kết thúc thì coi như đã quá hạn', () => {
    useTimerStore.setState({ status: 'completed', completedAt: null, sessionNo: 3 });
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionNo).toBe(1);
  });

  it('bấm Nghỉ thì mốc kết thúc được dọn, phiên nghỉ không bị hạn này đụng tới', () => {
    completeSession();
    useTimerStore.getState().startBreak();

    expect(useTimerStore.getState().completedAt).toBeNull();

    advance(minutesToMs(31));
    useTimerStore.getState().sync();

    // Hết nghỉ lúc app ngủ: vẫn là đường cũ của sync(), không phải đường hết hạn
    expect(useTimerStore.getState().phase).toBe('focus');
    expect(useTimerStore.getState().status).toBe('running');
  });
});

describe('timerStore — hạn của phiên tạm dừng', () => {
  beforeEach(() => {
    now = NINE_AM;
  });

  /** Chạy 10 phút rồi bấm Tạm dừng */
  function pauseMidSession() {
    useTimerStore.getState().start();
    advance(minutesToMs(10));
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().remainingMs).toBe(minutesToMs(15));
  }

  it('tạm dừng cả buổi trong cùng ngày thì vẫn chờ user bấm Tiếp tục', () => {
    pauseMidSession();

    advance(minutesToMs(5 * 60)); // đi họp 5 tiếng, vẫn trong ngày
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('paused');
    expect(s.remainingMs).toBe(minutesToMs(15));
    expect(useStatsStore.getState().sessions).toHaveLength(0);
  });

  it('tạm dừng từ hôm trước thì bỏ phiên, về phiên 1 sẵn sàng', () => {
    useTimerStore.setState({ sessionNo: 3 });
    pauseMidSession();

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.phase).toBe('focus');
    expect(s.remainingMs).toBe(FOCUS);
    expect(s.sessionNo).toBe(1);
    expect(s.pausedAt).toBeNull();
  });

  it('phần đã ngồi được ghi thành phiên gián đoạn của đúng ngày hôm đó', () => {
    pauseMidSession();
    const pausedAt = now;

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    const sessions = useStatsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(false);
    expect(sessions[0].durationMs).toBe(minutesToMs(10));
    // 10 phút đó ngồi hôm qua thì phải nằm ở hôm qua, không nhảy sang ngày mở app lại
    expect(sessions[0].endedAt).toBe(pausedAt);
  });

  it('bấm Bắt đầu rồi dừng ngay thì không ghi gì — chưa thành một phiên', () => {
    useTimerStore.getState().start();
    advance(30_000);
    useTimerStore.getState().pause();

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    expect(useStatsStore.getState().sessions).toHaveLength(0);
    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('phiên nghỉ treo qua đêm cũng về phiên focus sẵn sàng, và không vào log', () => {
    useTimerStore.getState().startBreak();
    advance(minutesToMs(2));
    useTimerStore.getState().pause();

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    const s = useTimerStore.getState();
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.remainingMs).toBe(FOCUS);
    expect(useStatsStore.getState().sessions).toHaveLength(0);
  });

  it('bản cũ chưa có mốc tạm dừng thì suy ra từ mốc bắt đầu phiên', () => {
    // Đúng cảnh update app giữa lúc đang có một phiên treo từ hôm trước
    useTimerStore.setState({
      status: 'paused',
      startedAt: NINE_AM,
      remainingMs: minutesToMs(15),
      plannedMs: FOCUS,
      pausedAt: null,
    });

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('idle');
    expect(useStatsStore.getState().sessions).toHaveLength(1);
  });

  it('không có mốc nào để suy thì để yên — không tự tay bỏ phiên của user', () => {
    useTimerStore.setState({
      status: 'paused',
      startedAt: null,
      pausedAt: null,
      remainingMs: minutesToMs(15),
    });

    now = NEXT_MORNING;
    useTimerStore.getState().sync();

    expect(useTimerStore.getState().status).toBe('paused');
    expect(useTimerStore.getState().remainingMs).toBe(minutesToMs(15));
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
