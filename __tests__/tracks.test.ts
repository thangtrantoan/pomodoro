import { TRACKS, findTrack, trackSource, tracksNeedingAttribution } from '../constants/tracks';

/**
 * Manifest hiện đang rỗng nên phần lớn test dưới đây pass một cách hiển nhiên. Cố ý:
 * chúng là bẫy đặt sẵn, sẽ nổ đúng lúc thêm track sai — chứ không phải sau khi app đã
 * lên store rồi mới phát hiện thiếu credit.
 */
describe('manifest nhạc nền', () => {
  it('id không trùng nhau', () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mọi track đều trỏ tới một file có thật', () => {
    for (const track of TRACKS) {
      // null = key `source` gõ sai, tới lúc chạy sẽ im lặng không phát
      expect(trackSource(track)).not.toBeNull();
    }
  });

  it('mọi track đều đã được xác nhận cho phép nhúng vào app', () => {
    for (const track of TRACKS) {
      expect(track.clearedForAppEmbedding).toBe(true);
    }
  });

  it('track nào cũng phải khai license và nguồn', () => {
    for (const track of TRACKS) {
      expect(track.license.trim()).not.toBe('');
      expect(track.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it('attribution phải là null hoặc câu credit thật, không được rỗng', () => {
    for (const track of TRACKS) {
      // Chuỗi rỗng nghĩa là "định điền rồi quên" — nguy hiểm hơn null vì màn credit
      // vẫn coi là có attribution và render ra một dòng trắng
      if (track.attribution !== null) {
        expect(track.attribution.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('license đòi ghi credit (CC BY) thì bắt buộc có attribution', () => {
    for (const track of TRACKS) {
      if (/CC[- ]?BY/i.test(track.license)) {
        expect(track.attribution).not.toBeNull();
      }
    }
  });

  it('màn credit chỉ lấy track có attribution', () => {
    expect(tracksNeedingAttribution().every((t) => t.attribution !== null)).toBe(true);
  });

  it('findTrack trả null cho id không có', () => {
    expect(findTrack(null)).toBeNull();
    expect(findTrack('khong-ton-tai')).toBeNull();
  });
});
