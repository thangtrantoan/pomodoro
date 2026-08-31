import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { Button } from '../components/ui/Button';
import { spacing, typography } from '../constants/theme';

export default function NotFoundScreen() {
  const c = useColors();
  const t = useT();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[typography.title, { color: c.text }]}>{t.notFound.title}</Text>
      <Button variant="secondary" style={styles.action} onPress={() => router.replace('/')}>
        {t.notFound.home}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
