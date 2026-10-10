import { useMemo } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { soundPlayable } from '../hooks/useSoundActive';
import { useSettingsStore } from '../store/settingsStore';
import { useTimerStore } from '../store/timerStore';
import { VOLUME_STEPS, useAudioStore } from '../store/audioStore';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ChoiceRow } from '../components/ui/ChoiceRow';
import { Toggle } from '../components/ui/Toggle';
import { TRACKS } from '../constants/tracks';
import { TICKS } from '../constants/ticks';
import { radius, spacing, tracking, typography } from '../constants/theme';
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
    warning: {
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: c.dangerLight,
    },
    warningTitle: { ...typography.hint, color: c.danger, marginBottom: 6 },
    warningBody: { ...typography.hint, color: c.textSecondary },
    creditsRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    creditsLink: { ...typography.hint, color: c.accent400 },
    footer: { padding: spacing.xl, ...typography.hint, color: c.textGhost },
  });
}

interface ToggleRow {
  key: FlagKey;
  label: string;
  hint: string;
  disabled?: boolean;
}

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
  const applyBasicMode = useTimerStore((st) => st.applyBasicMode);
  const notificationsGranted = useNotificationPermission();

  const sound = useAudioStore((st) => st.sound);
  const selectSound = useAudioStore((st) => st.selectSound);
  const volume = useAudioStore((st) => st.volume);
  const setVolume = useAudioStore((st) => st.setVolume);
  const tickInBreak = useAudioStore((st) => st.tickInBreak);
  const setTickInBreak = useAudioStore((st) => st.setTickInBreak);

  // Chọn một nguồn âm thanh là media notification của trình phát chiếm chỗ trên màn khoá, và
  // `useNotificationSync` tự ẩn đồng hồ thường trực để không có hai dòng chồng nhau của cùng
  // một app. Công tắc lúc đó không làm gì: làm mờ và nói thẳng lý do, thay vì để user gạt qua
  // gạt lại rồi tưởng app hỏng.
  const soundTakesOver = soundPlayable(sound);

  // Đồng hồ thường trực là chuyện riêng của Android — iOS không cho app treo một thông
  // báo không vuốt bỏ được (phải là Live Activity + code native, xem utils/notifications).
  // Ẩn hẳn hàng này thay vì để một công tắc bật hay tắt cũng như nhau.
  const ongoingRow: ToggleRow[] =
    Platform.OS === 'android'
      ? [
          {
            key: 'ongoing',
            label: t.settings.ongoing,
            hint: soundTakesOver ? t.settings.ongoingHintSound : t.settings.ongoingHint,
            disabled: soundTakesOver,
          },
        ]
      : [];

  // Cả hai công tắc này chỉ sống ở hai mốc của phiên nghỉ — `autoBreak` ở lúc vào nghỉ,
  // `autoStart` ở lúc hết nghỉ. Basic mode không có phiên nghỉ nên không mốc nào tới:
  // ẩn hẳn thay vì để hai công tắc gạt bật hay tắt cũng như nhau.
  const breakRows: ToggleRow[] = flags.basicMode
    ? []
    : [
        { key: 'autoStart', label: t.settings.autoStart, hint: t.settings.autoStartHint },
        { key: 'autoBreak', label: t.settings.autoBreak, hint: t.settings.autoBreakHint },
      ];

  const toggles: ToggleRow[] = [
    // Đặt đầu nhóm: đây là công tắc quyết định app có bao nhiêu thứ, không phải một tuỳ
    // chọn ngang hàng với các công tắc hành vi bên dưới
    { key: 'basicMode', label: t.settings.basicMode, hint: t.settings.basicModeHint },
    ...breakRows,
    { key: 'notify', label: t.settings.notify, hint: t.settings.notifyHint },
    { key: 'chime', label: t.settings.chime, hint: t.settings.chimeHint },
    ...ongoingRow,
    { key: 'keepAwake', label: t.settings.keepAwake, hint: t.settings.keepAwakeHint },
  ];

  const handleToggle = (key: FlagKey) => {
    toggleFlag(key);
    // Bật basic mode giữa một phiên nghỉ đang đếm thì phiên nghỉ đó phải tắt theo
    if (key === 'basicMode') applyBasicMode();
  };

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
            onToggle={() => handleToggle(item.key)}
            disabled={item.disabled}
          />
        ))}

        {/* Các công tắc thông báo ở trên chỉ có tác dụng khi còn quyền. Mất quyền mà không
            nói gì thì user gạt bật rồi tưởng app hỏng. Tự user đã tắt thông báo thì không
            có gì để cảnh báo — quyền bị chặn lúc đó là chuyện không liên quan. */}
        {notificationsGranted === false && flags.notify ? (
          <Pressable
            style={s.warning}
            onPress={() => void Linking.openSettings()}
            accessibilityRole="button"
            accessibilityLabel={t.settings.notifBlocked}
          >
            <Text style={s.warningTitle}>{t.settings.notifBlocked}</Text>
            <Text style={s.warningBody}>{t.settings.notifBlockedHint}</Text>
          </Pressable>
        ) : null}

        <View style={[s.block, { paddingTop: spacing.xl }]}>
          <Text style={s.label}>{t.sound.section}</Text>
          <Text style={s.empty}>{t.sound.hint}</Text>
        </View>

        <ChoiceRow
          label={t.sound.off}
          selected={sound === null}
          onPress={() => selectSound(null)}
        />

        {/* Nhạc và tick nằm chung MỘT danh sách chọn-một, không phải hai mục riêng: chọn cái
            này là bỏ cái kia, và đó chính là điều cần nhìn thấy ngay. Phân loại bằng dòng
            `meta` của từng hàng thay vì hai tiêu đề con — danh sách chỉ vài dòng. */}
        {TRACKS.map((track) => (
          <ChoiceRow
            key={`track-${track.id}`}
            label={track.title}
            meta={`${t.sound.music} · ${track.artist}`}
            selected={sound?.kind === 'track' && sound.id === track.id}
            onPress={() => selectSound({ kind: 'track', id: track.id })}
          />
        ))}
        {TICKS.map((tick) => (
          <ChoiceRow
            key={`tick-${tick.id}`}
            label={t.sound.tickNames[tick.id]}
            meta={t.sound.ticking}
            selected={sound?.kind === 'tick' && sound.id === tick.id}
            onPress={() => selectSound({ kind: 'tick', id: tick.id })}
          />
        ))}

        {/* Âm lượng chỉ có nghĩa khi đã chọn một nguồn. Công tắc giờ nghỉ thì chỉ có nghĩa với
            tick — nhạc nền không bao giờ phát trong giờ nghỉ, xem `useSoundActive` — và chỉ
            khi còn giờ nghỉ để nói tới, tức không phải basic mode. */}
        {sound !== null ? (
          <>
            <View style={[s.block, { paddingTop: spacing.xl }]}>
              <Text style={s.label}>{t.sound.volume}</Text>
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

            {sound.kind === 'tick' && !flags.basicMode ? (
              <Toggle
                label={t.sound.tickInBreak}
                hint={t.sound.tickInBreakHint}
                value={tickInBreak}
                onToggle={() => setTickInBreak(!tickInBreak)}
              />
            ) : null}
          </>
        ) : null}

        <Pressable
          style={s.creditsRow}
          onPress={() => router.push('/licenses')}
          accessibilityRole="button"
          accessibilityLabel={t.sound.credits}
        >
          <Text style={s.creditsLink}>{t.sound.credits}</Text>
        </Pressable>

        <Text style={s.footer}>{t.settings.footer}</Text>
      </ScrollView>
    </View>
  );
}
