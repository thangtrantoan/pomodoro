import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { numeral, radius, tracking, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

export interface Stat {
  value: string;
  label: string;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    // Nền = màu vạch chia; mỗi ô nền `background` chừa 1px gap → thành lưới kẻ mảnh
    boxed: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: c.neutral900,
      borderWidth: 1,
      borderColor: c.neutral900,
      borderRadius: radius.sm,
      overflow: 'hidden',
      gap: 1,
    },
    boxedCell: { width: '50%', backgroundColor: c.background, padding: 16, paddingHorizontal: 14 },
    plain: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, columnGap: 16 },
    plainCell: { width: '48%' },

    valueLg: { color: c.text },
    valueMd: { color: c.text },
    labelBoxed: {
      ...typography.hint,
      letterSpacing: tracking.wide,
      textTransform: 'uppercase',
      color: c.textFaint,
      marginTop: 7,
    },
    labelPlain: { ...typography.hint, color: c.textFaint, marginTop: 6 },
  });
}

interface Props {
  stats: Stat[];
  /**
   * `boxed` = lưới có khung kẻ (màn Done) · `plain` = 2 cột không khung (màn Record).
   * Hai biến thể này là hai khối khác nhau trong design, không phải một cái tuỳ biến.
   */
  variant?: 'boxed' | 'plain';
}

export function StatGrid({ stats, variant = 'boxed' }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const boxed = variant === 'boxed';

  return (
    <View style={boxed ? s.boxed : s.plain}>
      {stats.map((stat) => (
        <View key={stat.label} style={boxed ? s.boxedCell : s.plainCell}>
          <Text
            style={[boxed ? typography.statLg : typography.statMd, s.valueLg, numeral]}
            numberOfLines={1}
          >
            {stat.value}
          </Text>
          <Text style={boxed ? s.labelBoxed : s.labelPlain}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
