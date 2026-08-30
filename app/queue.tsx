import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useT } from '../hooks/useT';
import { useTaskStore } from '../store/taskStore';
import { Button } from '../components/ui/Button';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TaskRow } from '../components/ui/TaskRow';
import { PromptSheet } from '../components/ui/PromptSheet';
import { ConfirmDeleteSheet } from '../components/ui/ConfirmDeleteSheet';
import { spacing, typography } from '../constants/theme';
import type { AppColors } from '../constants/colors';
import type { Task } from '../types';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, paddingTop: spacing.lg },
    header: { paddingBottom: 18 },
    empty: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
    emptyTitle: { ...typography.title, color: c.textSecondary },
    emptyHint: { ...typography.small, color: c.textFaint, marginTop: spacing.sm },
    footer: { paddingHorizontal: spacing.xl, paddingTop: 18 },
  });
}

export default function QueueRoute() {
  const c = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tasks = useTaskStore((st) => st.tasks);
  const currentTaskId = useTaskStore((st) => st.currentTaskId);
  const addTask = useTaskStore((st) => st.addTask);
  const removeTask = useTaskStore((st) => st.removeTask);
  const selectTask = useTaskStore((st) => st.selectTask);

  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const pick = (id: string) => {
    selectTask(id);
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: spacing.lg + insets.top }]}>
      <ScreenHeader title={t.queue.kicker} onClose={() => router.back()} style={s.header} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow
            name={item.name}
            meta={
              item.estimate === null
                ? t.timer.noEstimate
                : t.timer.estimated(item.completed, item.estimate)
            }
            count={t.queue.count(item.completed, item.estimate)}
            active={item.id === currentTaskId}
            onPress={() => pick(item.id)}
            onLongPress={() => setPendingDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{t.queue.empty}</Text>
            <Text style={s.emptyHint}>{t.queue.emptyHint}</Text>
          </View>
        }
      />

      <View style={[s.footer, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <Button variant="dashed" height={48} onPress={() => setAdding(true)}>
          {t.queue.addTask}
        </Button>
      </View>

      <PromptSheet
        visible={adding}
        title={t.queue.newTask}
        label={t.queue.taskName}
        confirmLabel={t.common.add}
        onDismiss={() => setAdding(false)}
        onConfirm={(name) => {
          addTask(name);
          setAdding(false);
        }}
      />

      <ConfirmDeleteSheet
        visible={pendingDelete !== null}
        title={t.queue.deleteTitle}
        itemTitle={pendingDelete?.name ?? ''}
        subtitle={
          pendingDelete === null
            ? undefined
            : t.queue.count(pendingDelete.completed, pendingDelete.estimate)
        }
        onDismiss={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) removeTask(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </View>
  );
}
