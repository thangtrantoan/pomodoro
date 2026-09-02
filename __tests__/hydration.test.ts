import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../store/settingsStore';

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
      autoStart: true,
      autoBreak: false,
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
  });
});
