import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { useStatsStore } from '../store/statsStore';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { FadeRule } from '../components/ui/FadeRule';
import { StatGrid } from '../components/ui/StatGrid';
import { WeekBars } from '../components/ui/WeekBars';
import { deriveStats } from '../utils/stats';
import { formatClock, formatHours } from '../utils/time';
import { numeral, spacing, tracking, typography } from '../constants/theme';
import type { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, paddingTop: spacing.lg },
    header: { marginBottom: 26 },
    content: { paddingHorizontal: spacing.xl },
    heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginBottom: spacing.sm },
    heroValue: { ...typography.statHero, color: c.text },
    streakValue: { ...typography.statLg, color: c.accent300 },
    streakWrap: { paddingBottom: 6 },
    caption: {
      ...typography.hint,
      letterSpacing: tracking.wider,
      textTransform: 'uppercase',
      color: c.textFaint,
      marginTop: spacing.sm,
    },
    rule: { marginVertical: 24 },
    sectionLabel: {
      ...typography.hint,
      letterSpacing: tracking.wider,
      textTransform: 'uppercase',
      color: c.textFaint,
      marginBottom: spacing.lg,
    },
  });
}

export default function RecordRoute() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sessions = useStatsStore((st) => st.sessions);
  const stats = useMemo(() => deriveStats(sessions), [sessions]);

  const weekData = stats.week.map((d) => ({ label: t.record.days[d.weekday], count: d.count }));

  return (
    <View style={[s.root, { paddingTop: spacing.lg + insets.top }]}>
      <ScreenHeader title={t.record.kicker} onClose={() => router.back()} style={s.header} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: spacing.xxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroRow}>
          <View>
            <Text style={[s.heroValue, numeral]}>{formatHours(stats.focusedTodayMs)}</Text>
            <Text style={s.caption}>{t.record.focusedToday}</Text>
          </View>
          <View style={s.streakWrap}>
            <Text style={[s.streakValue, numeral]}>{stats.dayStreak}</Text>
            <Text style={s.caption}>{t.record.dayStreak}</Text>
          </View>
        </View>

        <FadeRule style={s.rule} />

        <Text style={s.sectionLabel}>{t.record.lastSeven}</Text>
        <WeekBars data={weekData} />

        <FadeRule style={s.rule} />

        <StatGrid
          variant="plain"
          stats={[
            { value: String(stats.sessionsThisWeek), label: t.record.sessionsWeek },
            { value: formatHours(stats.focusedThisWeekMs), label: t.record.focusedWeek },
            { value: formatClock(stats.medianSessionMs), label: t.record.medianSession },
            {
              value: `${Math.round(stats.completionRate * 100)}%`,
              label: t.record.completed,
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}
