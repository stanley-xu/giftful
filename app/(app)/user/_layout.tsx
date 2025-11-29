import { Stack } from "expo-router";

import { FollowingProvider } from "@/lib/contexts/FollowingContext";

export default function UserLayout() {
  return (
    <FollowingProvider>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerShown: true,
          headerLargeTitle: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Following",
            headerTransparent: true,
          }}
        />
        <Stack.Screen name="[userId]" />
      </Stack>
    </FollowingProvider>
  );
}
