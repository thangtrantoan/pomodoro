import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SoundChoice } from '../types';

/**
 * Âm lượng theo nấc rời — design không dùng slider ở đâu cả, mọi lựa chọn đều phân đoạn.
 * Ở đây chứ không ở màn Settings vì `migrate` cần đúng danh sách này để ép giá trị cũ về
 * một nấc có thật.
 */
export const VOLUME_STEPS = [0.25, 0.5, 0.75, 1] as const;

/**
 * Phải là một giá trị **có trong** `VOLUME_STEPS`: `SegmentedControl` so khớp bằng giá trị,
 * nên một mặc định nằm ngoài danh sách (0.4 của bản trước) làm cả thanh không nấc nào sáng
 * trên máy vừa cài.
 */
const DEFAULT_VOLUME = 0.5;

/** Ép một âm lượng bất kỳ về nấc gần nhất — dùng cho state đọc từ bản cũ */
function snapVolume(volume: number): number {
  return VOLUME_STEPS.reduce((best, step) =>
    Math.abs(step - volume) < Math.abs(best - volume) ? step : best,
  );
}

interface AudioState {
  /**
   * Nguồn âm thanh trong phiên; `null` = tắt.
   *
   * Một lựa chọn cho cả nhạc nền và tiếng tick, không phải hai công tắc — nghe hai thứ
   * cùng lúc là quá nhiều, và một nguồn duy nhất thì không cần trọng tài nào để quyết định
   * player nào giữ màn khoá.
   */
  sound: SoundChoice | null;
  selectSound: (sound: SoundChoice | null) => void;
  /** 0 → 1, dùng chung cho mọi nguồn */
  volume: number;
  setVolume: (volume: number) => void;
  /** Tick có phát tiếp trong giờ nghỉ hay không — vô nghĩa khi nguồn là nhạc nền */
  tickInBreak: boolean;
  setTickInBreak: (tickInBreak: boolean) => void;
}

/** State của bản trước khi gộp — chỉ `migrate` còn cần biết đến hình dạng này */
interface LegacyAudioState {
  enabled?: boolean;
  trackId?: string | null;
  volume?: number;
  tickId?: string | null;
  tickInBreak?: boolean;
}

/**
 * Bản đã cài đang giữ `enabled` + `trackId` (và có thể cả `tickId`). Không migrate là user
 * mở app lên thấy nhạc tự tắt.
 *
 * Nhạc thắng khi cả hai cùng bật: nó là thứ có trước, và là thứ user chọn có ý thức hơn.
 */
function migrateFromLegacy(persisted: unknown): Partial<AudioState> {
  const old = (persisted ?? {}) as LegacyAudioState;

  const sound: SoundChoice | null =
    old.enabled === true && typeof old.trackId === 'string'
      ? { kind: 'track', id: old.trackId }
      : typeof old.tickId === 'string'
        ? { kind: 'tick', id: old.tickId }
        : null;

  return {
    sound,
    volume: snapVolume(typeof old.volume === 'number' ? old.volume : DEFAULT_VOLUME),
    tickInBreak: old.tickInBreak === true,
  };
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      // Mặc định tắt: app phát tiếng mà không ai hỏi là thứ gây giật mình, không phải thứ
      // giúp tập trung
      sound: null,
      selectSound: (sound) => set({ sound }),
      volume: DEFAULT_VOLUME,
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      // Giờ nghỉ là để rời màn hình — mặc định im
      tickInBreak: false,
      setTickInBreak: (tickInBreak) => set({ tickInBreak }),
    }),
    {
      name: 'audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Một throw ở đây rơi vào `.catch` của chuỗi hydrate — nhánh không đặt `hasHydrated`
      // cũng không bắn `onFinishHydration` — nên cổng hydrate treo vĩnh viễn và app đứng
      // màn đen. Xem `tasks/16-hydration-deadlock.md`: `persisted` là `unknown`, không kiểu
      // nào chặn được, chỉ có phòng thủ trong thân hàm.
      migrate: (persisted, version) => {
        if (version >= 1) return (persisted ?? {}) as Partial<AudioState>;
        return migrateFromLegacy(persisted);
      },
    },
  ),
);
