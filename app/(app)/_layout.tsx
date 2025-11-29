import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

import { ProfileSheet } from "@/components/ProfileSheet";
import { Features } from "@/config";
import { BottomSheetProvider } from "@/lib/hooks/useBottomSheet";
import { colours, text } from "@/styles/tokens";
import { StatusBar } from "expo-status-bar";
import { DynamicColorIOS } from "react-native";

export default function TabLayout() {
  return (
    <BottomSheetProvider>
      <StatusBar style="dark" />

      <NativeTabs
        labelStyle={{
          color: DynamicColorIOS({
            dark: text.white,
            light: text.black,
          }),
        }}
        tintColor={DynamicColorIOS({
          dark: text.white,
          light: colours.accent,
        })}
      >
        <NativeTabs.Trigger name="index" hidden={!Features["home"]}>
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>Profile</Label>
          <Icon sf="person.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="user">
          <Label>Following</Label>
          <Icon sf="person.crop.rectangle.stack" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="events">
          <Label>Events</Label>
          <Icon sf="calendar" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="storybook" hidden={!__DEV__}>
          <Label>Storybook</Label>
          <Icon sf="book" />
        </NativeTabs.Trigger>
      </NativeTabs>
      <ProfileSheet />
    </BottomSheetProvider>
  );
}
