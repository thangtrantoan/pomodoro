import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Portal, Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { radius, spacing, tracking, typography } from '../../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  actions: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Base cho mọi popup của app — không dùng `Dialog` của react-native-paper trực tiếp. */
export function AnimatedSheet({ visible, title, onDismiss, actions, children, style }: Props) {
  const colors = useColors();
  const [mounted, setMounted] = useState(visible);
  const keyboardHeight = useKeyboardHeight();

  const translateY = useSharedValue(700);
  const backdropOpacity = useSharedValue(0);
  const kbOffset = useSharedValue(0);

  useEffect(() => {
    kbOffset.value = withTiming(keyboardHeight, { duration: 250 });
  }, [keyboardHeight, kbOffset]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    marginBottom: kbOffset.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 280, mass: 0.9 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(700, { duration: 220 });
      const timer = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(timer);
    }
  }, [visible, backdropOpacity, translateY]);

  if (!mounted) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Portal.Host>
        <View style={styles.container}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdropStyle]}
            pointerEvents="none"
          />
          <Pressable style={styles.dismissArea} onPress={onDismiss} />
          <Animated.View
            style={[styles.sheet, { backgroundColor: colors.surface }, slideStyle, style]}
          >
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            <Text
              style={[
                typography.kicker,
                styles.title,
                { letterSpacing: tracking.widest, color: colors.accent300 },
              ]}
            >
              {title}
            </Text>
            {children}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>{actions}</View>
          </Animated.View>
        </View>
      </Portal.Host>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dismissArea: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
});
