import { useMemo } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { nocturneColors } from '../constants/colors';
import { useStoresHydrated } from '../hooks/useHydrated';
import { useNotificationSync } from '../hooks/useNotificationSync';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useKeepAwakeSync } from '../hooks/useKeepAwakeSync';

/**
 * Nocturne là hệ dark thuần nên chỉ có một theme Paper. Map token Nocturne vào
 * MD3DarkTheme để `Text` và các control của Paper thừa hưởng đúng màu, không phải
 * set màu thủ công ở từng chỗ.
 */
function makePaperTheme() {
  const c = nocturneColors;
  return {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: c.accent,
      onPrimary: c.onPrimary,
      background: c.background,
      surface: c.surface,
      surfaceVariant: c.surfaceVariant,
      onSurface: c.text,
      onSurfaceVariant: c.textSecondary,
      outline: c.border,
      outlineVariant: c.borderStrong,
      error: c.danger,
      backdrop: c.backdrop,
    },
  };
}

/**
 * Theme của React Navigation — **cái này mới là nền vẽ phía sau lúc chuyển màn**.
 * Mặc định expo-router dùng `DefaultTheme` (nền trắng), nên dù `contentStyle` của Stack
 * đã tối thì mỗi lần đẩy/đóng route vẫn loé trắng một nhịp ở khe giữa hai màn.
 */
function makeNavTheme(): Theme {
  const c = nocturneColors;
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      primary: c.accent,
      notification: c.danger,
    },
  };
}

function AppShell() {
  // Gắn một lần ở root: lịch thông báo hết phiên + đồng hồ thường trực
  useNotificationSync();
  // Nhạc nền phải sống ngoài mọi route — chuyển sang Queue/Record không được ngắt nhạc
  useBackgroundMusic();
  useKeepAwakeSync();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: nocturneColors.background },
        animation: 'fade',
      }}
    />
  );
}

export default function RootLayout() {
  const paperTheme = useMemo(makePaperTheme, []);
  const navTheme = useMemo(makeNavTheme, []);
  const hydrated = useStoresHydrated();

  return (
    // Nền tối đặt ngay ở view gốc: view cửa sổ phía dưới mặc định là trắng, lúc
    // transition chạy sẽ hở ra qua khe giữa hai màn
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: nocturneColors.background }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <PaperProvider theme={paperTheme}>
            <StatusBar style="light" />
            {/* Chưa đọc xong AsyncStorage thì giữ nền trơn — render sớm sẽ nháy
                màn Onboarding một nhịp trước khi biết user đã qua bước đó chưa */}
            {hydrated ? (
              <AppShell />
            ) : (
              <View style={{ flex: 1, backgroundColor: nocturneColors.background }} />
            )}
          </PaperProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
