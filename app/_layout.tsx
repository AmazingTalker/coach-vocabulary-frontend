import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../contexts/AuthContext";
import { AlertProvider } from "../components/ui/Alert";
import { TrackingProvider } from "../contexts/TrackingContext";
import { useNotificationResponse } from "../hooks/useNotificationResponse";
import { refreshSignal } from "../utils/refreshSignal";

/**
 * 處理通知點擊，觸發資料刷新
 */
function NotificationHandler() {
  useNotificationResponse({
    onResponse: () => {
      refreshSignal.trigger();
    },
  });
  return null;
}

export default function RootLayout() {
  // 配置音訊模式（iOS 靜音模式下仍可播放）
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <TrackingProvider>
          <AuthProvider>
            <NotificationHandler />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
            </Stack>
          </AuthProvider>
        </TrackingProvider>
      </AlertProvider>
    </GestureHandlerRootView>
  );
}
