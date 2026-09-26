import { useCallback, useEffect, useRef, useState } from 'react';

/** Bao lâu không chạm vào màn hình thì ẩn lại */
const IDLE_MS = 10_000;

/**
 * Điều khiển tự ẩn khi đang chạy phiên — kiểu chrome của trình phát video.
 *
 * Màn đồng hồ lúc chạy chỉ cần đúng một thứ: con số. Nút Tạm dừng và Kết thúc sớm là hai
 * thứ không ai bấm trong 25 phút, nhưng lại là hai khối sáng nhất màn hình.
 *
 * `active === false` (tạm dừng / sẵn sàng / vừa xong) thì **luôn hiện và không hẹn ẩn**:
 * lúc đó nút Bắt đầu chính là việc duy nhất user cần làm, ẩn nó đi là app câm.
 *
 * Trả về `reveal` để gắn vào một vùng chạm phủ cả màn — gọi lại lúc đang hiện cũng được,
 * nó đặt lại đồng hồ chờ từ đầu.
 */
export function useAutoHide(
  active: boolean,
  idleMs: number = IDLE_MS,
): { visible: boolean; reveal: () => void } {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const arm = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setVisible(false), idleMs);
  }, [clear, idleMs]);

  useEffect(() => {
    if (!active) {
      clear();
      setVisible(true);
      return;
    }
    // Vừa bấm Bắt đầu cũng tính là một lần chạm: ẩn ngay dưới ngón tay vừa bấm là giật cục,
    // và user chưa kịp thấy nút đổi thành Tạm dừng
    setVisible(true);
    arm();
    return clear;
  }, [active, arm, clear]);

  const reveal = useCallback(() => {
    if (!active) return;
    setVisible(true);
    arm();
  }, [active, arm]);

  return { visible, reveal };
}
