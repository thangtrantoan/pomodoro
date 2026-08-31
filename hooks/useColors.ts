import { nocturneColors, type AppColors } from '../constants/colors';

/**
 * Accessor màu duy nhất của app. Nocturne là hệ dark thuần nên hiện chỉ có một bảng —
 * giữ hook lại để khi thêm light theme không phải sửa component nào.
 */
export function useColors(): AppColors {
  return nocturneColors;
}
