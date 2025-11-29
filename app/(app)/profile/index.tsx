import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import {
  Button,
  ProfileCard,
  Text,
  WishlistItemEditModal,
  WishlistSection,
} from "@/components";
import { Features } from "@/config";
import { profiles } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { useCollapsibleHeader } from "@/lib/hooks/useCollapsibleHeader";
import { useWishlists } from "@/lib/hooks/useWishlists";
import { WishlistItem as WishlistItemType } from "@/lib/schemas";
import { assert } from "@/lib/utils";
import { borderRadius, colours, spacing, text } from "@/styles/tokens";
import { router, useNavigation } from "expo-router";
import { ChevronUp, CirclePlus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_CARD_HEIGHT = 320;

export default function ProfileScreen() {
  const { profile, setProfile } = useAuthContext();
  assert(profile, "ProfileScreen should have profile context");

  const firstName = profile.name.split(" ")[0];

  const {
    animatedOverlayStyle,
    animatedSpacerStyle,
    animatedChevronStyle,
    toggleExpand,
    isExpanded,
    panGesture,
  } = useCollapsibleHeader({ cardHeight: PROFILE_CARD_HEIGHT });

  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: false,
      headerStyle: {
        backgroundColor: colours.surface,
      },
      headerTitle: () => (
        <TouchableOpacity
          onPress={toggleExpand}
          style={[styles.collapsedHeaderContent]}
        >
          <Text variant="semibold" fontSize="lg">
            {firstName}
          </Text>
          <Animated.View style={animatedChevronStyle}>
            <ChevronUp size={16} color={text.black} />
          </Animated.View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isExpanded, toggleExpand, animatedChevronStyle, firstName]);

  const {
    wishlists,
    wishlistItems,
    error,
    refetchWishlistItems,
    updateLocalItem,
    removeLocalItem,
  } = useWishlists();
  const [editingItem, setEditingItem] = useState<WishlistItemType | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const memoRefetchWishlistItems = useCallback(() => {
    if (wishlists.length > 0 && !Features["multi-wishlists"]) {
      refetchWishlistItems(wishlists[0].id);
    }
  }, [refetchWishlistItems, wishlists]);

  const handleProfileUpdate = async (field: string, value: string) => {
    const previousProfile = profile;
    setProfile({ ...profile, [field]: value });

    try {
      await profiles.updateProfile({ [field]: value });
    } catch (error) {
      setProfile(previousProfile);
      console.error(error);
    }
  };

  const handleItemPress = (item: WishlistItemType) => {
    setEditingItem(item);
    setIsEditModalVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colours.background }}
        contentContainerStyle={{ paddingBottom: 50 }} // Pad main content due to native tabs
      >
        <Pressable onPress={() => Keyboard.dismiss()}>
          <Animated.View style={animatedSpacerStyle} />
          <View style={styles.content}>
            <WishlistSection
              wishlists={wishlists}
              wishlistItems={wishlistItems}
              error={error}
              onItemPress={handleItemPress}
              refetch={memoRefetchWishlistItems}
              optimisticUpdateItem={updateLocalItem}
              optimisticRemoveItem={removeLocalItem}
            />
          </View>
        </Pressable>
      </Animated.ScrollView>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.profileCardContainer, animatedOverlayStyle]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <ProfileCard
            profile={profile}
            cardHeight={PROFILE_CARD_HEIGHT}
            onUpdate={handleProfileUpdate}
          />
        </Animated.View>
      </GestureDetector>

      <View style={[styles.bottomButtonWrapper, { bottom: bottom + 60 }]}>
        <Button
          onPress={() => router.push("/add-item")}
          style={styles.bottomButton}
        >
          <CirclePlus color={colours.background} />
          <Text variant="bold" fontSize="2xs">
            Add
          </Text>
        </Button>
      </View>

      <WishlistItemEditModal
        visible={isEditModalVisible}
        item={editingItem}
        optimisticUpdateItem={updateLocalItem}
        onSave={memoRefetchWishlistItems}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingItem(null);
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
    backgroundColor: colours.background,
  },
  bottomButtonWrapper: {
    flexDirection: "row",
    justifyContent: "center",
  },
  bottomButton: {
    width: 100,
    flexDirection: "column",
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
  },
  collapsedHeaderContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.md, // Used to vertically align on header content baseline
    width: 150,
    gap: 0,
  },
  profileCardContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PROFILE_CARD_HEIGHT,
  },
});
