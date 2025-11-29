import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { Loading, Text } from "@/components";
import { follows } from "@/lib/api";
import { useAuthContext } from "@/lib/auth";
import type { Profile } from "@/lib/schemas";
import { assert } from "@/lib/utils";
import { routes } from "@/lib/utils/routes";
import { colours, spacing, text } from "@/styles/tokens";

function FollowingItem({ profile }: { profile: Profile }) {
  const firstName = profile.name.split(" ")[0];
  const initials = profile.name
    .split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");

  return (
    <Link href={routes.user(profile.id) as any} asChild>
      <Pressable style={styles.item}>
        <View style={styles.avatar}>
          <Text variant="semibold" fontSize="lg" style={{ color: text.white }}>
            {initials}
          </Text>
        </View>
        <View style={styles.info}>
          <Text variant="semibold">{profile.name}</Text>
          {profile.bio && (
            <Text fontSize="sm" style={{ color: text.black, opacity: 0.6 }}>
              {profile.bio}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

export default function FollowingScreen() {
  const { session } = useAuthContext();
  assert(session, "FollowingScreen should be authenticated");

  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const { data, error } = await follows.getFollowing();
      if (error) throw error;
      setFollowing(data || []);
    } catch (err) {
      console.error("Error fetching following:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Loading />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text>Error loading following list</Text>
      </View>
    );
  }

  if (following.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text
          fontSize="lg"
          variant="semibold"
          style={{ marginBottom: spacing.sm }}
        >
          No one yet
        </Text>
        <Text style={{ color: text.black, opacity: 0.6, textAlign: "center" }}>
          When you follow people, they'll appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={following}
      renderItem={({ item }) => <FollowingItem profile={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: colours.background,
  // },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colours.background,
    paddingHorizontal: spacing.xl,
  },
  list: {
    paddingVertical: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colours.background,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colours.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
