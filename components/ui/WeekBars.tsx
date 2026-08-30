import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useColors } from '../../hooks/useColors';
import { numeral, typography } from '../../constants/theme';

/** Chiều cao vùng vẽ cột (px) — phần còn lại của khối 132px dành cho 2 nhãn + gap */
const BAR_AREA = 86;

interface Props {
  /** 7 ngày, cũ → mới. Ngày cuối là hôm nay và được tô accent đậm. */
  data: { label: string; count: number }[];
}

export function WeekBars({ data }: Props) {
  const c = useColors();
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const isToday = i === data.length - 1;
        return (
          <View key={d.label + i} style={styles.col}>
            <Text style={[typography.micro, { color: c.textFaint }, numeral]}>{d.count}</Text>
            <View
              style={[
                styles.bar,
                {
                  // Ngày 0 phiên vẫn để lại một vạch mảnh, nếu không hàng cột sẽ thủng
                  height: d.count === 0 ? 2 : Math.max(4, (d.count / max) * BAR_AREA),
                  backgroundColor: isToday ? c.statBarFill : c.statBarSubdued,
                },
              ]}
            />
            <Text style={[typography.micro, { color: c.textFaint, letterSpacing: 0.6 }]}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 132 },
  col: { flex: 1, alignItems: 'center', gap: 9, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
});
