import { Button, Text } from "@/components";
import { largeHeaderStyles } from "@/styles/styles";
import { router, Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="login"
        options={{
          ...largeHeaderStyles,
          // TODO: fun randomized greetings
          title: "Welcome, fellow gifter.",
          headerRight: () => (
            <Button.Unstyled
              onPress={() => router.push("/(auth)/register")}
              size="md"
            >
              <Text variant="semibold">Sign up</Text>
            </Button.Unstyled>
          ),
        }}
      />
      <Stack.Screen name="register" options={{ presentation: "modal" }} />
    </Stack>
  );
}
