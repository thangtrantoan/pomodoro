import { musicActiveNow, musicPlayable } from '../hooks/useMusicActive';
import { useAudioStore } from '../store/audioStore';
import { useTimerStore } from '../store/timerStore';
import { TRACKS } from '../constants/tracks';

const TRACK_ID = TRACKS[0].id;

/**
 * Quy tắc này giờ lái ba thứ cùng lúc: player phát/dừng, foreground service giữ process
 * sống khi tắt màn hình, và việc ẩn đồng hồ thường trực. Sai một nhánh là hỏng cả ba.
 */
beforeEach(() => {
  useAudioStore.setState({ enabled: true, trackId: TRACK_ID });
  useTimerStore.setState({ phase: 'focus', status: 'running' });
});

describe('musicActiveNow', () => {
  it('đang chạy phiên focus với track đã chọn thì phát', () => {
    expect(musicActiveNow()).toBe(true);
  });

  it('tắt công tắc nhạc thì không', () => {
    useAudioStore.setState({ enabled: false });
    expect(musicActiveNow()).toBe(false);
  });

  it('chưa chọn track thì không', () => {
    useAudioStore.setState({ trackId: null });
    expect(musicActiveNow()).toBe(false);
  });

  it('trackId không khớp track nào thì không — state persist từ bản cũ có thể trỏ sai', () => {
    useAudioStore.setState({ trackId: 'da-go-khoi-app' });
    expect(musicActiveNow()).toBe(false);
  });

  it('giờ nghỉ thì tắt — nghỉ là để rời màn hình', () => {
    useTimerStore.setState({ phase: 'shortBreak' });
    expect(musicActiveNow()).toBe(false);

    useTimerStore.setState({ phase: 'longBreak' });
    expect(musicActiveNow()).toBe(false);
  });

  it('tạm dừng hay đã xong thì tắt', () => {
    useTimerStore.setState({ status: 'paused' });
    expect(musicActiveNow()).toBe(false);

    useTimerStore.setState({ status: 'completed' });
    expect(musicActiveNow()).toBe(false);

    useTimerStore.setState({ status: 'idle' });
    expect(musicActiveNow()).toBe(false);
  });
});

/**
 * Màn Settings hỏi câu này để biết có nên làm mờ công tắc "Đồng hồ trên màn khoá" chưa —
 * lúc đó chưa có phiên nào chạy, nên phần phiên phải nằm ngoài quy tắc.
 */
describe('musicPlayable', () => {
  it('bật + track hợp lệ là true, kể cả khi không có phiên nào chạy', () => {
    useTimerStore.setState({ phase: 'focus', status: 'idle' });
    expect(musicPlayable(true, TRACK_ID)).toBe(true);
  });

  it('tắt nhạc, chưa chọn track, hoặc track đã gỡ khỏi app thì false', () => {
    expect(musicPlayable(false, TRACK_ID)).toBe(false);
    expect(musicPlayable(true, null)).toBe(false);
    expect(musicPlayable(true, 'da-go-khoi-app')).toBe(false);
  });
});
