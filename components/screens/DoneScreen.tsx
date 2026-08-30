import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { useTimerStore } from '../../store/timerStore';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStatsStore } from '../../store/statsStore';
import { AccentRule } from '../ui/AccentRule';
import { Button } from '../ui/Button';
import { StatGrid } from '../ui/StatGrid';
import { deriveStats } from '../../utils/stats';
import { formatClock, formatHours } from '../../utils/time';
import { tapFeedback } from '../../utils/haptics';
import { spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    center: { flex: 1, justifyContent: 'center' },
    rule: { marginBottom: 22 },
    title: { ...typography.displayMd, color: c.text, marginBottom: 10 },
    body: { ...typography.body, color: c.textSecondary, marginBottom: 30, maxWidth: 260 },
    taskName: { color: c.text },
    footer: { gap: 10 },
  });
}

export function DoneScreen() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sessionNo = useTimerStore((st) => st.sessionNo);
  const lastSessionMs = useTimerStore((st) => st.lastSessionMs);
  const startBreak = useTimerStore((st) => st.startBreak);
  const endSet = useTimerStore((st) => st.endSet);

  const sessionsPerSet = useSettingsStore((st) => st.sessionsPerSet);
  const shortBreakMinutes = useSettingsStore((st) => st.shortBreakMinutes);
  const longBreakMinutes = useSettingsStore((st) => st.longBreakMinutes);

  const tasks = useTaskStore((st) => st.tasks);
  const currentTaskId = useTaskStore((st) => st.currentTaskId);
  const sessions = useStatsStore((st) => st.sessions);

  const taskName = tasks.find((item) => item.id === currentTaskId)?.name ?? t.timer.noTask;
  const stats = useMemo(() => deriveStats(sessions), [sessions]);
  const isLongNext = sessionNo >= sessionsPerSet;
  const breakMinutes = isLongNext ? longBreakMinutes : shortBreakMinutes;

  const handleBreak = () => {
    tapFeedback();
    startBreak();
  };

  const handleEndSet = () => {
    endSet();
    // Design: "End set for today" dẫn thẳng sang màn thống kê
    router.push('/record');
  };

  return (
    <View
      style={[
        s.root,
        { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.xxl + insets.bottom },
      ]}
    >
      <View style={s.center}>
        <AccentRule style={s.rule} />
        <Text style={s.title}>{t.done.title}</Text>
        <Text style={s.body}>
          {t.done.bodyBefore(formatClock(lastSessionMs))}
          <Text style={s.taskName}>{taskName}</Text>
          {t.done.bodyAfter} {t.done.position(sessionNo, sessionsPerSet)}
        </Text>

        <StatGrid
          stats={[
            { value: String(stats.sessionsToday), label: t.done.sessionsToday },
            { value: formatHours(stats.focusedTodayMs), label: t.done.focusedToday },
            { value: String(stats.dayStreak), label: t.done.dayStreak },
            { value: String(stats.interruptionsToday), label: t.done.interruptions },
          ]}
        />
      </View>

      <View style={s.footer}>
        <Button height={56} onPress={handleBreak}>
          {t.done.takeBreak(breakMinutes)}
        </Button>
        <Button variant="ghost" height={40} onPress={handleEndSet}>
          {t.done.endSet}
        </Button>
      </View>
    </View>
  );
}
