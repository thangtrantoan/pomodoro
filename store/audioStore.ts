import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Âm lượng mặc định — nhạc nền là nền, không phải thứ để nghe */
const DEFAULT_VOLUME = 0.4;

interface AudioState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** id của track đang chọn trong `TRACKS`; null = chưa chọn */
  trackId: string | null;
  selectTrack: (trackId: string | null) => void;
  /** 0 → 1 */
  volume: number;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      // Mặc định tắt: app ship ra chưa có track nào, bật sẵn thì user bấm start
      // và không có gì phát, trông như hỏng
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
      trackId: null,
      selectTrack: (trackId) => set({ trackId }),
      volume: DEFAULT_VOLUME,
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
