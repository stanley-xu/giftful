import { Stack } from "expo-router";

import { FollowingProvider } from "@/lib/contexts/FollowingContext";

export default function UserLayout() {
  return (
    <FollowingProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerLargeTitle: true,
          headerTransparent: true,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Following" }} />
        <Stack.Screen name="[userId]" />
      </Stack>
    </FollowingProvider>
  );
}
