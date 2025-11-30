import { AuthProvider, useAuthContext } from "@/lib/auth";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import SplashScreenController from "./splash";

export default function RootLayout() {
  if (__DEV__) {
    console.debug("🧑‍💻 Launched in dev mode!");
  }

  return (
    <AuthProvider>
      <SplashScreenController />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, profile, loading: profileLoading } = useAuthContext();

  const guardStates = {
    loading: profileLoading,
    auth: !session,
    app: Boolean(session && !profileLoading && profile),
    welcome: Boolean(session && !profileLoading && !profile),
  };

  if (__DEV__) {
    // Print the available guard states for protected routes
    const groupedStates = Object.entries(guardStates).reduce(
      (acc, [key, value]) => {
        if (value) {
          acc["open"].push(key);
        } else {
          acc["closed"].push(key);
        }
        return acc;
      },
      { open: [], closed: [] } as { open: string[]; closed: string[] }
    );
    console.debug(groupedStates);
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Protected guard={guardStates.loading}>
          <Stack.Screen name="loading" />
        </Stack.Protected>
        <Stack.Protected guard={guardStates.auth}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={guardStates.app}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={guardStates.welcome}>
          <Stack.Screen
            name="welcome"
            options={{
              headerShown: true,
              headerShadowVisible: false,
              headerTransparent: true,
              title: "",
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={guardStates.app}>
          <Stack.Screen
            name="add-item"
            options={{
              presentation: "modal",
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
