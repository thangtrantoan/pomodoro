import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAutoHide } from '../../hooks/useAutoHide';
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

/** Mờ dần đủ nhanh để không thành hiệu ứng, đủ chậm để không giật */
const FADE_MS = 220;

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    // Basic mode không có kicker phiên ở bên trái — `space-between` với một con duy nhất
    // sẽ đẩy nhóm nút sang trái, phải ghim lại về phải
    headerBasic: { justifyContent: 'flex-end' },
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
  const basicMode = useSettingsStore((st) => st.flags.basicMode);
  const tasks = useTaskStore((st) => st.tasks);
  const currentTaskId = useTaskStore((st) => st.currentTaskId);

  const task = tasks.find((item) => item.id === currentTaskId) ?? null;
  const running = status === 'running';
  const untouched = remainingMs >= plannedMs;

  const stateLabel = running ? t.timer.focusing : untouched ? t.timer.ready : t.timer.paused;
  const primaryLabel = running ? t.timer.pause : untouched ? t.timer.start : t.timer.resume;
  // Chưa động vào phiên thì nút phụ là "đổi việc"; đã chạy rồi thì là "kết thúc sớm"
  const canEndEarly = running || !untouched;

  // Việc chưa chạy phiên nào thì không có gì để nói — ẩn hẳn dòng meta
  const taskMeta =
    task === null
      ? t.timer.pickTask
      : task.completed > 0
        ? t.timer.sessionsDone(task.completed)
        : null;

  // Basic mode bỏ hẳn phần việc cần làm — bỏ luôn cửa vào nó
  const chrome = [
    ...(basicMode ? [] : [{ label: t.timer.queue, go: () => router.push('/queue') }]),
    { label: t.timer.record, go: () => router.push('/record') },
    { label: t.timer.settings, go: () => router.push('/settings') },
  ];

  // Nút phụ chỉ còn một việc trong basic mode. Chưa chạy phiên nào thì không có gì để
  // kết thúc sớm — ẩn hẳn thay vì để một nút bấm vào không làm gì.
  const showSecondary = canEndEarly || !basicMode;

  // Đang chạy thì hai nút ở đáy tự mờ đi sau 10s; chạm vào màn hình là hiện lại
  const { visible: controlsVisible, reveal } = useAutoHide(running);

  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withTiming(controlsVisible ? 1 : 0, { duration: FADE_MS });
  }, [controlsVisible, fade]);
  const footerFade = useAnimatedStyle(() => ({ opacity: fade.value }));

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
    // Vùng chạm phủ cả màn để hiện lại hai nút. `accessible={false}` để screen reader không
    // đọc cả màn hình thành một cái nút — các phần tử con vẫn focus được bình thường.
    // Chạm vào một Pressable con (hàng nút trên, tên việc, hai nút ở đáy) thì con giữ
    // responder và `onPress` này không chạy, nên không có cú chạm nào bị tính hai lần.
    <Pressable
      accessible={false}
      onPress={reveal}
      style={[
        s.root,
        { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.xxl + insets.bottom },
      ]}
    >
      <View style={[s.header, basicMode && s.headerBasic]}>
        {!basicMode && <Kicker>{t.timer.session(sessionNo, sessionsPerSet)}</Kicker>}
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

        {!basicMode && (
          <Pressable
            style={s.task}
            onPress={() => router.push('/queue')}
            accessibilityRole="button"
            accessibilityLabel={task?.name ?? t.timer.noTask}
          >
            <Text style={s.taskName} numberOfLines={2}>
              {task?.name ?? t.timer.noTask}
            </Text>
            {taskMeta !== null && <Text style={s.taskMeta}>{taskMeta}</Text>}
          </Pressable>
        )}
      </View>

      {/* CTA ghim ngoài vùng cuộn — màn nhỏ vẫn thấy.
          Mờ đi chứ không co chiều cao: layout đứng yên, vòng tiến trình không nhảy một nhịp
          mỗi lần ẩn/hiện. Mờ rồi thì phải chặn chạm, nếu không nút Tạm dừng vô hình sẽ ăn
          mất đúng cú chạm để hiện lại — và phải rời cây accessibility, không để screen
          reader focus vào một nút bấm không ăn. */}
      <Animated.View
        style={[s.footer, footerFade]}
        pointerEvents={controlsVisible ? 'auto' : 'none'}
        accessibilityElementsHidden={!controlsVisible}
        importantForAccessibility={controlsVisible ? 'auto' : 'no-hide-descendants'}
      >
        <Button height={56} onPress={handleToggle}>
          {primaryLabel}
        </Button>
        {showSecondary && (
          <Button variant="ghost" height={40} onPress={handleSecondary}>
            {canEndEarly ? t.timer.endEarly : t.timer.changeTask}
          </Button>
        )}
      </Animated.View>
    </Pressable>
  );
}
