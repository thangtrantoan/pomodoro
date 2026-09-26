/**
 * `react-test-renderer` đã có sẵn trong cây phụ thuộc (khớp React 19.1.0, kéo theo từ
 * react-native) nhưng không kèm type, và `@types/react-test-renderer` không nằm trong
 * devDependencies.
 *
 * Khai đúng phần đang dùng ở `__tests__/autoHide.test.tsx` — chạy một hook trong một cây
 * React thật — thay vì thêm một dependency chỉ để có type.
 *
 * File này cố ý **không** có import/export ở cấp cao nhất: `declare module` cho một package
 * chưa có type chỉ hợp lệ trong một script toàn cục, còn trong một module thì nó bị hiểu là
 * *augmentation* và đòi package phải có type sẵn. Kiểu của React lấy qua `import(...)` nội
 * dòng vì cú pháp đó không biến file thành module.
 */
declare module 'react-test-renderer' {
  export interface ReactTestRenderer {
    update(element: import('react').ReactElement): void;
    unmount(): void;
  }

  export function create(element: import('react').ReactElement): ReactTestRenderer;

  /** Chỉ dùng bản đồng bộ — mọi callback trong test đều không async */
  export function act(callback: () => void): void;
}
