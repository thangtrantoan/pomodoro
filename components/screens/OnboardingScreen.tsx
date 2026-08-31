import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { useT } from '../../hooks/useT';
import { useSettingsStore } from '../../store/settingsStore';
import { AccentRule } from '../ui/AccentRule';
import { Button } from '../ui/Button';
import { Kicker } from '../ui/Kicker';
import { spacing, typography } from '../../constants/theme';
import type { AppColors } from '../../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28 },
    brand: { marginBottom: 'auto', paddingTop: 56 },
    rule: { marginBottom: spacing.xl },
    title: { ...typography.displayLg, color: c.text, marginBottom: 18 },
    body: { ...typography.body, color: c.textSecondary, marginBottom: spacing.xxl, maxWidth: 270 },
    meta: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 18 },
    metaText: { ...typography.small, color: c.textFaint },
  });
}

export function OnboardingScreen() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const focusMinutes = useSettingsStore((st) => st.focusMinutes);
  const shortBreakMinutes = useSettingsStore((st) => st.shortBreakMinutes);
  const longBreakMinutes = useSettingsStore((st) => st.longBreakMinutes);
  const sessionsPerSet = useSettingsStore((st) => st.sessionsPerSet);
  const setHasOnboarded = useSettingsStore((st) => st.setHasOnboarded);

  return (
    <View style={[s.root, { paddingBottom: 40 + insets.bottom }]}>
      <Kicker color={c.accent400} space="giga" style={[s.brand, { paddingTop: 56 + insets.top }]}>
        {t.onboarding.brand}
      </Kicker>

      <AccentRule style={s.rule} />
      <Text style={s.title}>{t.onboarding.title}</Text>
      <Text style={s.body}>{t.onboarding.body}</Text>

      <Button height={52} onPress={setHasOnboarded}>
        {t.onboarding.begin}
      </Button>

      <View style={s.meta}>
        <Text style={s.metaText}>
          {t.onboarding.metaLengths(focusMinutes, shortBreakMinutes, longBreakMinutes)}
        </Text>
        <Text style={s.metaText}>·</Text>
        <Text style={s.metaText}>{t.onboarding.metaPerSet(sessionsPerSet)}</Text>
        <Text style={s.metaText}>·</Text>
        <Text style={s.metaText}>{t.onboarding.metaChange}</Text>
      </View>
    </View>
  );
}
