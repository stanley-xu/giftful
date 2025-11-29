import { Stack } from "expo-router";

export default function UserLayout() {
  return (
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
      <Stack.Screen
        name="[userId]"
        options={{
          presentation: "card",
        }}
      />
    </Stack>
  );
}
