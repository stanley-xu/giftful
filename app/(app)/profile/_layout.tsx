import { IconButton } from "@/components/Button";
import { APP_CONFIG } from "@/config";
import { shareTokens, wishlists as wishlistsApi } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import { useBottomSheet } from "@/lib/hooks/useBottomSheet";
import { assert } from "@/lib/utils";
import { generateShareUrl } from "@/lib/utils/routes";
import { text } from "@/styles/tokens";
import { Stack } from "expo-router";
import { Settings, Share as ShareIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Share } from "react-native";

const ShareButton = () => {
  const { profile, session } = useAuthContext();
  assert(
    profile && session,
    "ProfileLayout should be authenticated and have profile context"
  );
  const currentUser = session.user;

  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);

      // Get user's wishlist (singleton for MVP)
      const { data: wishlists, error: wishlistError } =
        await wishlistsApi.getByUserId(currentUser.id);

      if (wishlistError || !wishlists || wishlists.length === 0) {
        setLoading(false);
        Alert.alert("Error", "No wishlist found to share");
        return;
      }

      const wishlist = wishlists[0]; // Get first wishlist (singleton)

      // Generate token for that wishlist
      const { data: token, error: tokenError } = await shareTokens.findOrCreate(
        wishlist.id
      );

      // end of required network calls
      setLoading(false);

      if (tokenError || !token) {
        Alert.alert("Error", "Failed to generate share link");
        return;
      }

      const userName = profile.name || "My";
      const shareUrl = generateShareUrl(
        APP_CONFIG.WEB_URL,
        currentUser.id,
        wishlist.id,
        token
      );

      await Share.share({
        message: `Check out ${userName}'s wishlist!`,
        url: shareUrl,
        title: `${userName}'s Wishlist`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconButton onPress={handleShare} disabled={loading}>
      {loading ? (
        <ActivityIndicator size="small" color={text.black} />
      ) : (
        <ShareIcon size={24} />
      )}
    </IconButton>
  );
};

const BottomSheetButton = () => {
  const { openBottomSheet } = useBottomSheet();

  return (
    <IconButton onPress={openBottomSheet}>
      <Settings size={24} />
    </IconButton>
  );
};

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTransparent: true,
          title: "",
          headerRight: () => <ShareButton />,
          headerLeft: () => <BottomSheetButton />,
        }}
      />
    </Stack>
  );
}
