import { TICKS, findTick, tickSource } from '../constants/ticks';
import { translations } from '../constants/i18n';

/**
 * Cùng loại bẫy như `tracks.test.ts`: nổ đúng lúc thêm một tiếng tick sai, chứ không phải
 * sau khi app đã lên store rồi user mới thấy chọn xong mà im lặng.
 */
describe('manifest tiếng tick', () => {
  it('id không trùng nhau', () => {
    const ids = TICKS.map((tick) => tick.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mọi tiếng đều trỏ tới một file có thật', () => {
    for (const tick of TICKS) {
      // null = key `source` gõ sai, tới lúc chạy sẽ im lặng không phát
      expect(tickSource(tick)).not.toBeNull();
    }
  });

  it('mọi tiếng đều có nhãn ở cả hai ngôn ngữ', () => {
    for (const lang of ['vi', 'en'] as const) {
      for (const tick of TICKS) {
        expect(translations[lang].sound.tickNames[tick.id].trim()).not.toBe('');
      }
    }
  });

  it('findTick trả null cho id không có', () => {
    expect(findTick(null)).toBeNull();
    expect(findTick('khong-ton-tai')).toBeNull();
  });
});
