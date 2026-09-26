import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAutoHide } from '../hooks/useAutoHide';

const IDLE_MS = 10_000;

/**
 * `react-test-renderer` đã có sẵn trong cây phụ thuộc (khớp React 19.1.0) nên không phải
 * thêm dependency nào để chạy một hook. Component `Probe` không render gì — chỉ để có một
 * cây React thật cho effect và state chạy đúng vòng đời.
 */
function mount(active: boolean) {
  let api: ReturnType<typeof useAutoHide> = { visible: true, reveal: () => {} };

  function Probe({ active: on }: { active: boolean }) {
    api = useAutoHide(on);
    return null;
  }

  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Probe active={active} />);
  });

  return {
    get visible() {
      return api.visible;
    },
    reveal: () =>
      act(() => {
        api.reveal();
      }),
    setActive: (next: boolean) =>
      act(() => {
        tree.update(<Probe active={next} />);
      }),
    wait: (ms: number) =>
      act(() => {
        jest.advanceTimersByTime(ms);
      }),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useAutoHide', () => {
  it('không chạy phiên thì luôn hiện, không bao giờ tự ẩn', () => {
    const h = mount(false);
    expect(h.visible).toBe(true);

    // Nút Bắt đầu là việc duy nhất user cần làm lúc này — ẩn nó đi là app câm
    h.wait(IDLE_MS * 3);
    expect(h.visible).toBe(true);
  });

  it('đang chạy thì còn hiện đúng 10s rồi ẩn', () => {
    const h = mount(true);
    expect(h.visible).toBe(true);

    h.wait(IDLE_MS - 1);
    expect(h.visible).toBe(true);

    h.wait(1);
    expect(h.visible).toBe(false);
  });

  it('chạm vào màn hình thì hiện lại, rồi 10s sau ẩn tiếp', () => {
    const h = mount(true);
    h.wait(IDLE_MS);
    expect(h.visible).toBe(false);

    h.reveal();
    expect(h.visible).toBe(true);

    h.wait(IDLE_MS);
    expect(h.visible).toBe(false);
  });

  it('chạm lúc đang hiện thì đặt lại đồng hồ chờ từ đầu', () => {
    const h = mount(true);

    h.wait(IDLE_MS - 500);
    h.reveal();

    // Nếu không đặt lại thì nửa giây nữa là ẩn
    h.wait(IDLE_MS - 500);
    expect(h.visible).toBe(true);

    h.wait(500);
    expect(h.visible).toBe(false);
  });

  it('tạm dừng lúc đang ẩn thì hiện lại ngay', () => {
    const h = mount(true);
    h.wait(IDLE_MS);
    expect(h.visible).toBe(false);

    h.setActive(false);
    expect(h.visible).toBe(true);
  });

  it('chạm lúc không chạy phiên không hẹn ẩn — đã hiện rồi thì hiện luôn', () => {
    const h = mount(false);
    h.reveal();

    h.wait(IDLE_MS * 2);
    expect(h.visible).toBe(true);
  });
});
