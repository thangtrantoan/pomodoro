import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TRACKS } from '../constants/tracks';
import { spacing, typography } from '../constants/theme';
import type { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, paddingTop: spacing.lg },
    header: { paddingBottom: spacing.xl },
    content: { paddingHorizontal: spacing.xl },
    intro: { ...typography.small, color: c.textFaint, marginBottom: spacing.xl },
    entry: {
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    title: { ...typography.title, color: c.text },
    license: { ...typography.hint, color: c.accent300, marginTop: 4 },
    // Câu credit in nguyên văn theo yêu cầu của giấy phép — không tự ghép lại
    attribution: { ...typography.hint, color: c.textSecondary, marginTop: spacing.sm },
    link: { ...typography.hint, color: c.accent400, marginTop: 6 },
    empty: { ...typography.body, color: c.textFaint },
  });
}

export default function LicensesRoute() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: spacing.lg + insets.top }]}>
      <ScreenHeader title={t.music.creditsKicker} onClose={() => router.back()} style={s.header} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: spacing.xxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {TRACKS.length === 0 ? (
          <Text style={s.empty}>{t.music.creditsEmpty}</Text>
        ) : (
          <>
            <Text style={s.intro}>{t.music.creditsIntro}</Text>
            {TRACKS.map((track) => (
              <View key={track.id} style={s.entry}>
                <Text style={s.title}>{track.title}</Text>
                <Text style={s.license}>{track.license}</Text>
                {track.attribution ? (
                  <Text style={s.attribution} selectable>
                    {track.attribution}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => Linking.openURL(track.sourceUrl)}
                  accessibilityRole="link"
                  accessibilityLabel={track.sourceUrl}
                >
                  <Text style={s.link}>{track.sourceUrl}</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
