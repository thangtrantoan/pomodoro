import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { useTimerStore } from '../../store/timerStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../ui/Button';
import { Kicker } from '../ui/Kicker';
import { ProgressRing } from '../ui/ProgressRing';
import { VerticalGradient } from '../ui/VerticalGradient';
import { formatClock } from '../../utils/time';
import { lightFeedback } from '../../utils/haptics';
import { numeral, spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

const RING_SIZE = 236;

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    // Gốc không có padding để nền chuyển màu tràn hết mép trên (dưới thanh trạng thái).
    // Trong Yoga, padding của cha đẩy cả con `position: absolute` — để padding ở đây thì
    // gradient sẽ tụt xuống, hở một vệt nền phẳng ở đỉnh màn.
    root: { flex: 1 },
    content: { flex: 1, paddingHorizontal: spacing.xl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    clock: { ...typography.clockBreak, color: c.accent200 },
    body: {
      ...typography.body,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 26,
      maxWidth: 250,
    },
  });
}

export function BreakScreen() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const phase = useTimerStore((st) => st.phase);
  const remainingMs = useTimerStore((st) => st.remainingMs);
  const plannedMs = useTimerStore((st) => st.plannedMs);
  const skipBreak = useTimerStore((st) => st.skipBreak);
  const autoStart = useSettingsStore((st) => st.flags.autoStart);

  const isLong = phase === 'longBreak';

  // "The next session starts on its own" chỉ đúng khi bật tự chạy — tắt thì đổi câu,
  // không để copy hứa một hành vi không xảy ra
  const body = isLong ? t.break.bodyLong : autoStart ? t.break.body : t.break.bodyManual;

  const handleSkip = () => {
    lightFeedback();
    skipBreak();
  };

  return (
    <View style={s.root}>
      <VerticalGradient from={c.accent900} to={c.background} />

      <View
        style={[
          s.content,
          {
            paddingTop: spacing.lg + insets.top,
            paddingBottom: spacing.xxl + insets.bottom,
          },
        ]}
      >
        <Kicker color={c.accent300}>{isLong ? t.break.kickerLong : t.break.kicker}</Kicker>

        <View style={s.center}>
          <ProgressRing
            size={RING_SIZE}
            progress={1 - remainingMs / plannedMs}
            color={c.accent400}
            opacity={0.8}
          >
            <Text style={[s.clock, numeral]}>{formatClock(remainingMs)}</Text>
          </ProgressRing>
          <Text style={s.body}>{body}</Text>
        </View>

        <Button variant="secondary" height={52} onPress={handleSkip}>
          {t.break.skip}
        </Button>
      </View>
    </View>
  );
}
