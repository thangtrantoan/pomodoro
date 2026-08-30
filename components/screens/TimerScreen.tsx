import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { useTimerStore } from '../../store/timerStore';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../ui/Button';
import { Kicker } from '../ui/Kicker';
import { ProgressRing } from '../ui/ProgressRing';
import { RadialGlow } from '../ui/RadialGlow';
import { formatClock } from '../../utils/time';
import { tapFeedback } from '../../utils/haptics';
import { numeral, radius, spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

const RING_SIZE = 264;
const GLOW_INSET = 26;

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chrome: { flexDirection: 'row', gap: spacing.xs },
    chromeBtn: {
      minWidth: 40,
      height: 40,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    chromePressed: { backgroundColor: c.accent900 },
    chromeLabel: { ...typography.hint, letterSpacing: 0.44, color: c.textMuted },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    ringWrap: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      top: GLOW_INSET,
      left: GLOW_INSET,
      width: RING_SIZE - GLOW_INSET * 2,
      height: RING_SIZE - GLOW_INSET * 2,
    },
    clock: { ...typography.clock, color: c.text },
    state: { marginTop: spacing.sm },

    task: { marginTop: 28, alignItems: 'center', maxWidth: 260 },
    taskName: { ...typography.title, color: c.text, textAlign: 'center' },
    taskMeta: { ...typography.small, color: c.textFaint, marginTop: 5, textAlign: 'center' },

    footer: { gap: 10 },
  });
}

export function TimerScreen() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const status = useTimerStore((st) => st.status);
  const remainingMs = useTimerStore((st) => st.remainingMs);
  const plannedMs = useTimerStore((st) => st.plannedMs);
  const sessionNo = useTimerStore((st) => st.sessionNo);
  const toggle = useTimerStore((st) => st.toggle);
  const endEarly = useTimerStore((st) => st.endEarly);

  const sessionsPerSet = useSettingsStore((st) => st.sessionsPerSet);
  const tasks = useTaskStore((st) => st.tasks);
  const currentTaskId = useTaskStore((st) => st.currentTaskId);

  const task = tasks.find((item) => item.id === currentTaskId) ?? null;
  const running = status === 'running';
  const untouched = remainingMs >= plannedMs;

  const stateLabel = running ? t.timer.focusing : untouched ? t.timer.ready : t.timer.paused;
  const primaryLabel = running ? t.timer.pause : untouched ? t.timer.start : t.timer.resume;
  // Chưa động vào phiên thì nút phụ là "đổi việc"; đã chạy rồi thì là "kết thúc sớm"
  const canEndEarly = running || !untouched;

  const chrome = [
    { label: t.timer.queue, go: () => router.push('/queue') },
    { label: t.timer.record, go: () => router.push('/record') },
    { label: t.timer.settings, go: () => router.push('/settings') },
  ];

  const handleToggle = () => {
    tapFeedback();
    toggle();
  };

  const handleSecondary = () => {
    if (!canEndEarly) {
      router.push('/queue');
      return;
    }
    tapFeedback();
    endEarly();
  };

  return (
    <View
      style={[
        s.root,
        { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.xxl + insets.bottom },
      ]}
    >
      <View style={s.header}>
        <Kicker>{t.timer.session(sessionNo, sessionsPerSet)}</Kicker>
        <View style={s.chrome}>
          {chrome.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [s.chromeBtn, pressed && s.chromePressed]}
              onPress={item.go}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={s.chromeLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.center}>
        <View style={s.ringWrap}>
          <View style={s.glow}>
            <RadialGlow size={RING_SIZE - GLOW_INSET * 2} />
          </View>
          <ProgressRing size={RING_SIZE} progress={1 - remainingMs / plannedMs}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.clock, numeral]}>{formatClock(remainingMs)}</Text>
              <Kicker space="mega" style={s.state}>
                {stateLabel}
              </Kicker>
            </View>
          </ProgressRing>
        </View>

        <Pressable
          style={s.task}
          onPress={() => router.push('/queue')}
          accessibilityRole="button"
          accessibilityLabel={task?.name ?? t.timer.noTask}
        >
          <Text style={s.taskName} numberOfLines={2}>
            {task?.name ?? t.timer.noTask}
          </Text>
          <Text style={s.taskMeta}>
            {task === null
              ? t.timer.pickTask
              : task.estimate === null
                ? t.timer.noEstimate
                : t.timer.estimated(task.completed, task.estimate)}
          </Text>
        </Pressable>
      </View>

      {/* CTA ghim ngoài vùng cuộn — màn nhỏ vẫn thấy */}
      <View style={s.footer}>
        <Button height={56} onPress={handleToggle}>
          {primaryLabel}
        </Button>
        <Button variant="ghost" height={40} onPress={handleSecondary}>
          {canEndEarly ? t.timer.endEarly : t.timer.changeTask}
        </Button>
      </View>
    </View>
  );
}
