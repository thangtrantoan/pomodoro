import { soundActiveNow, soundPlayable } from '../hooks/useSoundActive';
import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { TRACKS } from '../constants/tracks';
import { TICKS } from '../constants/ticks';

const TRACK_ID = TRACKS[0].id;
const TICK_ID = TICKS[0].id;

/**
 * Quy tắc này lái ba thứ cùng lúc: player phát/dừng, foreground service giữ process sống khi
 * tắt màn hình, và việc ẩn đồng hồ thường trực. Sai một nhánh là hỏng cả ba.
 */
beforeEach(() => {
  useAudioStore.setState({ sound: { kind: 'track', id: TRACK_ID }, tickInBreak: false });
  useTimerStore.setState({ phase: 'focus', status: 'running' });
});

describe('soundActiveNow', () => {
  it('đang chạy phiên focus với nguồn đã chọn thì phát', () => {
    expect(soundActiveNow()).toBe(true);

    useAudioStore.setState({ sound: { kind: 'tick', id: TICK_ID } });
    expect(soundActiveNow()).toBe(true);
  });

  it('tắt âm thanh thì không', () => {
    useAudioStore.setState({ sound: null });
    expect(soundActiveNow()).toBe(false);
  });

  it('id không khớp gì thì không — state persist từ bản cũ có thể trỏ vào thứ đã gỡ', () => {
    useAudioStore.setState({ sound: { kind: 'track', id: 'da-go-khoi-app' } });
    expect(soundActiveNow()).toBe(false);

    useAudioStore.setState({ sound: { kind: 'tick', id: 'da-go-khoi-app' } });
    expect(soundActiveNow()).toBe(false);
  });

  it('tạm dừng hay đã xong thì tắt', () => {
    for (const status of ['paused', 'completed', 'idle'] as const) {
      useTimerStore.setState({ status });
      expect(soundActiveNow()).toBe(false);
    }
  });

  it('giờ nghỉ thì nhạc nền tắt — nghỉ là để rời màn hình', () => {
    for (const phase of ['shortBreak', 'longBreak'] as const) {
      useTimerStore.setState({ phase });
      expect(soundActiveNow()).toBe(false);
    }
  });

  it('giờ nghỉ: tick chỉ phát tiếp khi user chủ động bật', () => {
    useAudioStore.setState({ sound: { kind: 'tick', id: TICK_ID } });
    useTimerStore.setState({ phase: 'shortBreak' });
    expect(soundActiveNow()).toBe(false);

    useAudioStore.setState({ tickInBreak: true });
    expect(soundActiveNow()).toBe(true);
  });

  it('tickInBreak không kéo nhạc nền vào giờ nghỉ — công tắc đó chỉ nói về tick', () => {
    useAudioStore.setState({ sound: { kind: 'track', id: TRACK_ID }, tickInBreak: true });
    useTimerStore.setState({ phase: 'shortBreak' });
    expect(soundActiveNow()).toBe(false);
  });
});

/**
 * Màn Settings hỏi câu này để biết có nên làm mờ công tắc "Đồng hồ trên màn khoá" chưa — lúc
 * đó chưa có phiên nào chạy, nên phần phiên phải nằm ngoài quy tắc.
 */
describe('soundPlayable', () => {
  it('nguồn hợp lệ là true, kể cả khi không có phiên nào chạy', () => {
    useTimerStore.setState({ phase: 'focus', status: 'idle' });
    expect(soundPlayable({ kind: 'track', id: TRACK_ID })).toBe(true);
    expect(soundPlayable({ kind: 'tick', id: TICK_ID })).toBe(true);
  });

  it('tắt, hoặc id đã gỡ khỏi app, thì false', () => {
    expect(soundPlayable(null)).toBe(false);
    expect(soundPlayable({ kind: 'track', id: 'da-go-khoi-app' })).toBe(false);
    expect(soundPlayable({ kind: 'tick', id: 'da-go-khoi-app' })).toBe(false);
  });

  it('không lẫn hai manifest: id tick khai là track thì false', () => {
    expect(soundPlayable({ kind: 'track', id: TICK_ID })).toBe(false);
    expect(soundPlayable({ kind: 'tick', id: TRACK_ID })).toBe(false);
  });
});
