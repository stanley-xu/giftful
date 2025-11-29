import { router } from "expo-router";
import { UserSearch } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { ModalHeader } from "@/components/ModalHeader";
import { Text, TextProps } from "@/components/Text";
import { VisibilitySelector } from "@/components/VisibilitySelector";
import { wishlists } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { useBottomSheet } from "@/lib/hooks/useBottomSheet";
import type { Wishlist } from "@/lib/schemas";
import { colours, spacing, text } from "@/styles/tokens";

interface SheetItemProps {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: TextProps["variant"];
}

function SheetItem({
  label,
  icon,
  onPress,
  variant = "semibold",
}: SheetItemProps) {
  return (
    <Button
      onPress={onPress}
      variant="outline"
      size="sm"
      style={[
        styles.sheetItem,
        variant === "destructive" && { borderColor: colours.error },
      ]}
    >
      {icon}
      <Text variant={variant} fontSize="sm">
        {label}
      </Text>
    </Button>
  );
}

export function ProfileSheet() {
  const { isOpen, closeBottomSheet } = useBottomSheet();
  const { signOut, profile } = useAuthContext();
  const [currentWishlist, setCurrentWishlist] = useState<Wishlist | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current wishlist when sheet opens
  useEffect(() => {
    if (isOpen && profile) {
      fetchWishlist();
    }
  }, [isOpen, profile]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await wishlists.getAll();
      if (error) throw error;

      // Get first wishlist (single-wishlist mode for now)
      if (data && data.length > 0) {
        setCurrentWishlist(data[0]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      Alert.alert("Error", "Failed to load wishlist settings");
    }
  };

  const handleVisibilityChange = async (
    visibility: "private" | "follower" | "public"
  ) => {
    if (!currentWishlist || isUpdating) return;

    setIsUpdating(true);
    try {
      const { data, error } = await wishlists.update(currentWishlist.id, {
        visibility,
      });

      if (error) throw error;

      // Update local state
      if (data) {
        setCurrentWishlist(data);
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      Alert.alert("Error", "Failed to update visibility");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <BottomSheet visible={isOpen} onClose={closeBottomSheet}>
      <ModalHeader
        title=""
        onSave={() => {
          closeBottomSheet();
          signOut();
        }}
        saveText="Logout"
        saveOutline
        saveDestructive
      />

      {/* Wishlist Visibility */}
      <VisibilitySelector
        defaultValue={currentWishlist?.visibility ?? "private"}
        onChange={handleVisibilityChange}
        disabled={isUpdating}
      />

      {/* Developer Section */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: text.black,
              opacity: 0.5,
              paddingBottom: spacing.md,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Developer
          </Text>
          <SheetItem
            label="Preview your profile"
            icon={<UserSearch size={20} color={text.black} />}
            onPress={() => {
              closeBottomSheet();
              if (profile) {
                router.push(`/user/${profile.id}` as any);
              }
            }}
          />
          <SheetItem
            label="View a shared wishlist"
            icon={<UserSearch size={20} color={text.black} />}
            onPress={() => {
              Alert.prompt(
                "Enter a wishlist share link",
                "Paste the full share URL",
                (input: string) => {
                  // Parse the share link and navigate
                  // Expected format: see routes.ts
                  const link = input.slice(input.indexOf("user"));

                  if (link && profile) {
                    closeBottomSheet();
                    //@ts-expect-error
                    router.navigate(`/${link}`);
                  }
                }
              );
            }}
          />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    margin: spacing.md,
    gap: spacing.sm,
  },
  sheetItem: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});
