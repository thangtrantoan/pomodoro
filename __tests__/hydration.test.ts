import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../store/settingsStore';
import { useAudioStore } from '../store/audioStore';
import { TRACKS } from '../constants/tracks';

/**
 * Máy vừa cài app lần đầu: AsyncStorage rỗng.
 *
 * zustand **vẫn gọi `merge`** trong trường hợp đó, với `persisted === undefined`. Một
 * throw ở đấy rơi vào `.catch` của chuỗi hydrate — nhánh không đặt `hasHydrated` và không
 * bắn `onFinishHydration` — nên `useStoresHydrated()` treo `false` vĩnh viễn và app đứng
 * màn đen. Chính xác cái đã ship ở commit 1ebc943.
 *
 * Không có kiểu nào chặn được: `persisted` là `unknown`, ép `as Partial<SettingsState>`
 * thì `saved.flags` compile xanh. Chỉ test này giữ được.
 */
describe('hydrate với AsyncStorage rỗng', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('settingsStore hydrate xong chứ không treo', async () => {
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.persist.hasHydrated()).toBe(true);
  });

  it('giữ nguyên flags mặc định', async () => {
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().flags).toEqual({
      // basicMode tắt: một bản cập nhật không được tự tay rút gọn app của user đang dùng
      basicMode: false,
      autoStart: true,
      autoBreak: false,
      notify: true,
      chime: true,
      ongoing: true,
      keepAwake: true,
    });
  });

  it('bản cũ thiếu cờ mới thì bù bằng mặc định, không thành undefined', async () => {
    await AsyncStorage.setItem(
      'settings-storage',
      JSON.stringify({ state: { flags: { autoStart: false } }, version: 0 }),
    );
    await useSettingsStore.persist.rehydrate();

    const { flags } = useSettingsStore.getState();
    expect(flags.autoStart).toBe(false);
    expect(flags.autoBreak).toBe(false);
    expect(flags.keepAwake).toBe(true);
    // Đúng cảnh của bản vừa cập nhật: bản cài cũ không biết hai cờ này
    expect(flags.basicMode).toBe(false);
    expect(flags.notify).toBe(true);
  });
});

/**
 * Bản đã phát hành lưu `enabled` + `trackId` + `volume`; bản gộp nguồn âm thanh lưu một
 * `sound` duy nhất. Không migrate là user cập nhật app rồi mở lên thấy nhạc tự tắt.
 *
 * `migrate` cũng chạy **bên trong** chuỗi hydrate của persist, nên một throw ở đây treo cổng
 * hydrate y như `merge` — xem đầu file.
 */
describe('audioStore — migrate từ bản trước khi gộp nguồn âm thanh', () => {
  const TRACK_ID = TRACKS[0].id;

  async function rehydrateWith(state: Record<string, unknown>) {
    await AsyncStorage.setItem('audio-storage', JSON.stringify({ state, version: 0 }));
    await useAudioStore.persist.rehydrate();
    return useAudioStore.getState();
  }

  beforeEach(async () => {
    await AsyncStorage.clear();
    // Store là singleton trong module nên state của test trước còn nguyên trong memory.
    // Đặt lại đúng hình dạng của máy vừa cài, nếu không mỗi test lại kế thừa nguồn cũ.
    useAudioStore.setState({ sound: null, volume: 0.5, tickInBreak: false });
  });

  it('đang bật nhạc thì giữ đúng bản nhạc đó', async () => {
    const { sound } = await rehydrateWith({ enabled: true, trackId: TRACK_ID, volume: 0.5 });
    expect(sound).toEqual({ kind: 'track', id: TRACK_ID });
  });

  it('đã chọn tick thì giữ tick', async () => {
    const { sound } = await rehydrateWith({ enabled: false, tickId: 'soft' });
    expect(sound).toEqual({ kind: 'tick', id: 'soft' });
  });

  it('tắt nhạc rồi thì không tự bật lại', async () => {
    const { sound } = await rehydrateWith({ enabled: false, trackId: TRACK_ID });
    expect(sound).toBeNull();
  });

  it('âm lượng cũ nằm ngoài nấc thì ép về nấc gần nhất', async () => {
    // 0.4 là mặc định của bản trước, không có trong VOLUME_STEPS — để nguyên thì
    // SegmentedControl không nấc nào sáng
    const { volume } = await rehydrateWith({ enabled: true, trackId: TRACK_ID, volume: 0.4 });
    expect(volume).toBe(0.5);
  });

  it('máy chưa có gì thì hydrate xong chứ không treo, và không tự bật nguồn nào', async () => {
    // Cùng cái bẫy với settingsStore ở đầu file: `migrate` không được gọi khi storage rỗng,
    // nhưng `merge` thì có — throw ở đó là cổng hydrate treo và app đứng màn đen
    await useAudioStore.persist.rehydrate();

    expect(useAudioStore.persist.hasHydrated()).toBe(true);
    expect(useAudioStore.getState().sound).toBeNull();
  });
});
