import { View } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTimerStore } from '../store/timerStore';
import { useCountdown } from '../hooks/useCountdown';
import { useColors } from '../hooks/useColors';
import { OnboardingScreen } from '../components/screens/OnboardingScreen';
import { TimerScreen } from '../components/screens/TimerScreen';
import { BreakScreen } from '../components/screens/BreakScreen';
import { DoneScreen } from '../components/screens/DoneScreen';

/**
 * Bốn màn Onboarding / Timer / Break / Done trong design là bốn trạng thái của **một**
 * màn hình, không phải bốn route: chúng dùng chung một đồng hồ đang chạy. Tách thành
 * route riêng sẽ làm đồng hồ bị remount mỗi lần chuyển.
 */
export default function IndexRoute() {
  const c = useColors();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);

  useCountdown();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {!hasOnboarded ? (
        <OnboardingScreen />
      ) : phase !== 'focus' ? (
        <BreakScreen />
      ) : status === 'completed' ? (
        <DoneScreen />
      ) : (
        <TimerScreen />
      )}
    </View>
  );
}
