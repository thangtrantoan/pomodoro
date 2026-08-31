import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { useSettingsStore } from '../store/settingsStore';
import { useTimerStore } from '../store/timerStore';
import { useAudioStore } from '../store/audioStore';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ChoiceRow } from '../components/ui/ChoiceRow';
import { Toggle } from '../components/ui/Toggle';
import { TRACKS } from '../constants/tracks';
import { spacing, tracking, typography } from '../constants/theme';
import { FOCUS_LENGTHS, type FlagKey, type FocusMinutes, type Lang } from '../types';
import type { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, paddingTop: spacing.lg },
    header: { paddingBottom: spacing.xl },
    block: { paddingHorizontal: spacing.xl, paddingBottom: 22 },
    label: {
      ...typography.hint,
      letterSpacing: tracking.wider,
      textTransform: 'uppercase',
      color: c.textFaint,
      marginBottom: spacing.md,
    },
    empty: { ...typography.hint, color: c.textFaint },
    emptyHint: { ...typography.hint, color: c.textGhost, marginTop: 6 },
    creditsRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    creditsLink: { ...typography.hint, color: c.accent400 },
    footer: { padding: spacing.xl, ...typography.hint, color: c.textGhost },
  });
}

/** Âm lượng theo nấc rời — design không dùng slider ở đâu cả, mọi lựa chọn đều phân đoạn */
const VOLUME_STEPS = [0.25, 0.5, 0.75, 1] as const;

export default function SettingsRoute() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const language = useSettingsStore((st) => st.language);
  const setLanguage = useSettingsStore((st) => st.setLanguage);
  const focusMinutes = useSettingsStore((st) => st.focusMinutes);
  const setFocusMinutes = useSettingsStore((st) => st.setFocusMinutes);
  const flags = useSettingsStore((st) => st.flags);
  const toggleFlag = useSettingsStore((st) => st.toggleFlag);
  const applyToTimer = useTimerStore((st) => st.applyFocusLength);

  const musicEnabled = useAudioStore((st) => st.enabled);
  const setMusicEnabled = useAudioStore((st) => st.setEnabled);
  const trackId = useAudioStore((st) => st.trackId);
  const selectTrack = useAudioStore((st) => st.selectTrack);
  const volume = useAudioStore((st) => st.volume);
  const setVolume = useAudioStore((st) => st.setVolume);

  const toggles: { key: FlagKey; label: string; hint: string }[] = [
    { key: 'autoStart', label: t.settings.autoStart, hint: t.settings.autoStartHint },
    { key: 'chime', label: t.settings.chime, hint: t.settings.chimeHint },
    { key: 'ongoing', label: t.settings.ongoing, hint: t.settings.ongoingHint },
  ];

  const handleFocusLength = (value: string) => {
    setFocusMinutes(Number(value) as FocusMinutes);
    // Đồng hồ đang idle thì áp ngay độ dài mới; đang chạy thì để phiên sau
    applyToTimer();
  };

  return (
    <View style={[s.root, { paddingTop: spacing.lg + insets.top }]}>
      <ScreenHeader title={t.settings.kicker} onClose={() => router.back()} style={s.header} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.block}>
          <Text style={s.label}>{t.settings.focusLength}</Text>
          <SegmentedControl
            tabular
            options={FOCUS_LENGTHS.map((n) => ({
              value: String(n),
              label: t.settings.minutes(n),
            }))}
            value={String(focusMinutes)}
            onChange={handleFocusLength}
          />
        </View>

        <View style={s.block}>
          <Text style={s.label}>{t.settings.language}</Text>
          <SegmentedControl
            options={[
              { value: 'vi', label: 'Tiếng Việt' },
              { value: 'en', label: 'English' },
            ]}
            value={language}
            onChange={(value) => setLanguage(value as Lang)}
          />
        </View>

        {toggles.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            hint={item.hint}
            value={flags[item.key]}
            onToggle={() => toggleFlag(item.key)}
          />
        ))}

        <View style={[s.block, { paddingTop: spacing.xl }]}>
          <Text style={s.label}>{t.music.section}</Text>
          {/* Chưa bundle bản nhạc nào thì nói thẳng, không hiện control chết */}
          {TRACKS.length === 0 ? (
            <>
              <Text style={s.empty}>{t.music.empty}</Text>
              <Text style={s.emptyHint}>{t.music.emptyHint}</Text>
            </>
          ) : (
            <Text style={s.empty}>{t.music.playsDuringFocus}</Text>
          )}
        </View>

        {TRACKS.length > 0 ? (
          <>
            <ChoiceRow
              label={t.music.off}
              selected={!musicEnabled}
              onPress={() => setMusicEnabled(false)}
            />
            {TRACKS.map((track) => (
              <ChoiceRow
                key={track.id}
                label={track.title}
                meta={track.artist}
                selected={musicEnabled && trackId === track.id}
                onPress={() => {
                  selectTrack(track.id);
                  setMusicEnabled(true);
                }}
              />
            ))}

            <View style={[s.block, { paddingTop: spacing.xl }]}>
              <Text style={s.label}>{t.music.volume}</Text>
              <SegmentedControl
                tabular
                options={VOLUME_STEPS.map((v) => ({
                  value: String(v),
                  label: `${Math.round(v * 100)}%`,
                }))}
                value={String(volume)}
                onChange={(value) => setVolume(Number(value))}
              />
            </View>
          </>
        ) : null}

        <Pressable
          style={s.creditsRow}
          onPress={() => router.push('/licenses')}
          accessibilityRole="button"
          accessibilityLabel={t.music.credits}
        >
          <Text style={s.creditsLink}>{t.music.credits}</Text>
        </Pressable>

        <Text style={s.footer}>{t.settings.footer}</Text>
      </ScrollView>
    </View>
  );
}
