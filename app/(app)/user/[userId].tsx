import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { ChevronUp, UserCheck, UserPlus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { Loading, Text } from "@/components";
import { ProfileCard } from "@/components/ProfileCard";
import { WishlistItemEditModal } from "@/components/WishlistItemEditModal";
import { WishlistSection } from "@/components/WishlistSection";
import { Features } from "@/config";
import {
  profiles,
  shareTokens,
  wishlistItems as wishlistItemsApi,
  wishlists as wishlistsApi,
} from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { useFollowing } from "@/lib/contexts/FollowingContext";
import { useCollapsibleHeader } from "@/lib/hooks/useCollapsibleHeader";
import type { Profile, Wishlist, WishlistItem } from "@/lib/schemas";
import { assert } from "@/lib/utils";
import { colours, spacing, text } from "@/styles/tokens";

const PROFILE_CARD_HEIGHT = 320;

function FollowButton({
  isFollowing,
  isLoading,
  onPress,
  style,
}: {
  isFollowing: boolean;
  isLoading: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      // fixing width to prevent layout shift when isFollowing status finishes loading
      style={[style, { width: 100 }]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={text.black} />
      ) : isFollowing ? (
        <UserCheck size={20} color={text.black} />
      ) : (
        <UserPlus size={20} color={text.black} />
      )}
      <Text variant="semibold" fontSize="sm">
        {isFollowing ? "Unfollow" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  // Note: this is the currently logged in user, not necessarily the one whose profile we're rendering
  const { session, profile: currentProfile } = useAuthContext();
  assert(
    session && currentProfile,
    "UserProfileScreen should be authenticated and have profile context"
  );

  const {
    userId,
    list: wishlistId,
    share: shareToken,
    name: nameParam,
    isFollowing: isFollowingParam,
  } = useLocalSearchParams<{
    userId: string;
    list?: string;
    share?: string;
    name?: string;
    isFollowing?: string;
  }>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [viewingItem, setViewingItem] = useState<WishlistItem | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(isFollowingParam === "true");
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  // If we have the param, we already know the follow status
  const [isFollowStatusLoading, setIsFollowStatusLoading] = useState(
    !isFollowingParam
  );

  // Use name from param if available, otherwise from fetched profile
  const firstName = (nameParam || profile?.name)?.split(" ")[0] || "";

  // Check if this is a shared wishlist view (has share token)
  const isSharedView = !!shareToken && !!wishlistId;

  const {
    animatedOverlayStyle,
    animatedContentPaddingStyle,
    animatedSpacerStyle,
    animatedChevronStyle,
    toggleExpand,
    isExpanded,
    panGesture,
  } = useCollapsibleHeader({
    cardHeight: PROFILE_CARD_HEIGHT,
    headerHeight,
    initialExpanded: isSharedView,
  });

  const { follow, unfollow, isFollowingUser } = useFollowing();

  const handleFollowToggle = useCallback(async () => {
    if (isFollowLoading) return;

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setIsFollowLoading(true);

    try {
      if (wasFollowing) {
        await unfollow(userId);
      } else if (profile) {
        await follow(profile);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setIsFollowing(wasFollowing);
    } finally {
      setIsFollowLoading(false);
    }
  }, [isFollowLoading, isFollowing, userId, follow, unfollow, profile]);

  useEffect(() => {
    const isOwnProfile = session.user.id === userId;

    const followButton = !isOwnProfile ? (
      <FollowButton
        isFollowing={isFollowing}
        isLoading={isFollowLoading || isFollowStatusLoading}
        onPress={handleFollowToggle}
        style={styles.headerButton}
      />
    ) : null;

    const profileButton = (
      <TouchableOpacity onPress={toggleExpand} style={styles.headerButton}>
        <Animated.View style={animatedChevronStyle}>
          <ChevronUp size={24} color={text.black} />
        </Animated.View>
      </TouchableOpacity>
    );

    navigation.setOptions({
      title: firstName,
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 4 }}>
          {followButton}
          {profileButton}
        </View>
      ),
    });
  }, [
    navigation,
    firstName,
    isExpanded,
    toggleExpand,
    animatedChevronStyle,
    userId,
    isFollowing,
    isFollowLoading,
    isFollowStatusLoading,
    handleFollowToggle,
    session.user.id,
  ]);

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);

        const currentUser = session.user;
        let userHasAccess = false;

        // 1. User viewing their own profile - always has access
        if (currentUser.id === userId) {
          userHasAccess = true;
        }
        // 2. Share token - overrides all visibility settings
        else if (wishlistId && shareToken) {
          const { data: isValid } = await shareTokens.validateFor(
            wishlistId,
            shareToken
          );
          userHasAccess = Boolean(isValid);
        }
        // 3. Check wishlist visibility + following status
        else {
          // Fetch the user's wishlists to check visibility
          const { data: wishlistsData } = await wishlistsApi.getByUserId(
            userId
          );

          if (wishlistsData && wishlistsData.length > 0) {
            // In single-wishlist mode, check the first wishlist
            const wishlist = wishlistsData[0];

            if (wishlist.visibility === "public") {
              // Public - anyone can see
              userHasAccess = true;
            } else if (wishlist.visibility === "follower") {
              // Follower - only followers can see
              userHasAccess = isFollowingUser(userId);
            } else {
              // Private - only owner can see (already handled above)
              userHasAccess = false;
            }
          }
        }

        setHasAccess(userHasAccess);

        // If we don't have access, stop here
        if (!userHasAccess) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } =
          await profiles.getById(userId);
        if (profileError) throw profileError;
        if (!profileData) throw new Error("Profile not found");
        setProfile(profileData);

        // Fetch wishlists
        const { data: wishlistsData, error: wishlistsError } =
          await wishlistsApi.getByUserId(userId);
        if (wishlistsError) throw wishlistsError;
        setWishlists(wishlistsData || []);

        // Fetch wishlist items for the first wishlist (single wishlist mode)
        if (
          wishlistsData &&
          wishlistsData.length > 0 &&
          !Features["multi-wishlists"]
        ) {
          const wishlist = wishlistsData[0];
          const { data: itemsData, error: itemsError } =
            await wishlistItemsApi.getByWishlistId(wishlist.id);
          if (itemsError) throw itemsError;
          setWishlistItems(itemsData || []);
        }

        // Set follow status from context (only if not own profile and not already known from params)
        if (userHasAccess && currentUser.id !== userId && !isFollowingParam) {
          setIsFollowing(isFollowingUser(userId));
          setIsFollowStatusLoading(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err as Error);
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [userId, shareToken, isFollowingParam, isFollowingUser]);

  const refetchWishlistItems = useCallback(async (wishlistId: string) => {
    try {
      const { data: itemsData, error: itemsError } =
        await wishlistItemsApi.getByWishlistId(wishlistId);
      if (itemsError) throw itemsError;
      setWishlistItems(itemsData || []);
    } catch (err) {
      console.error("Error refetching wishlist items:", err);
    }
  }, []);

  const handleItemPress = (item: WishlistItem) => {
    setViewingItem(item);
    setIsViewModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Loading />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text fontSize="lg" style={{ marginBottom: spacing.md }}>
          This wishlist is private
        </Text>
        <Text style={{ color: colours.text, opacity: 0.6 }}>
          Ask the owner to share it with you
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text>
          Error loading profile: {error?.message || "Profile not found"}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colours.background }}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* Spacer that animates with the overlay to push content down */}
        <Animated.View style={animatedSpacerStyle} />

        <WishlistSection
          wishlists={wishlists}
          wishlistItems={wishlistItems}
          error={error}
          onItemPress={handleItemPress}
          refetch={refetchWishlistItems}
          readOnly
        />
      </ScrollView>

      {/* Profile card overlay - extends from top of screen, with padding for header */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.profileCardContainer, animatedOverlayStyle]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <Animated.View style={[{ flex: 1 }, animatedContentPaddingStyle]}>
            <ProfileCard profile={profile} readOnly />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <WishlistItemEditModal
        visible={isViewModalVisible}
        item={viewingItem}
        onClose={() => {
          setIsViewModalVisible(false);
          setViewingItem(null);
        }}
        readOnly
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
    backgroundColor: colours.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colours.background,
  },
  profileCardContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PROFILE_CARD_HEIGHT,
    backgroundColor: colours.surface,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
