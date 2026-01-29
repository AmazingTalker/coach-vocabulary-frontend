import { Stack } from "expo-router";
import { useScreenTracking } from "../../hooks/useScreenTracking";

export default function AuthLayout() {
  // 自動追蹤畫面瀏覽
  useScreenTracking();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
