import { colours, spacing, text, typography } from "@/styles/tokens";
import { ExtendedStackNavigationOptions } from "expo-router/build/layouts/StackClient";
import { StyleSheet } from "react-native";

export const fullPageStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing["3xl"],
    paddingHorizontal: 16,
    backgroundColor: colours.background,
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.semibold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize["xl"],
    fontWeight: typography.fontWeight.normal,
    textAlign: "center",
  },
});

export const largeHeaderStyles: ExtendedStackNavigationOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colours.surfaceDark },
  headerTintColor: text.white,
  headerLargeTitle: true,
  headerLargeStyle: { backgroundColor: colours.surfaceDark },
  headerLargeTitleStyle: { color: text.white },
  headerLargeTitleShadowVisible: true,
};

const bottomTabBarStyles = {};
