import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { follows } from "@/lib/api";
import type { Profile } from "@/lib/schemas";

interface FollowingContextType {
  following: Profile[];
  isLoading: boolean;
  error: Error | null;
  fetchFollowing: () => Promise<void>;
  follow: (profile: Profile) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  isFollowingUser: (userId: string) => boolean;
}

const FollowingContext = createContext<FollowingContextType | null>(null);

export function FollowingProvider({ children }: { children: ReactNode }) {
  const [following, setFollowing] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFollowing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await follows.getFollowing();
      if (fetchError) throw fetchError;
      setFollowing(data || []);
    } catch (err) {
      console.error("Error fetching following:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const follow = useCallback(async (profile: Profile) => {
    // Optimistic update
    setFollowing((prev) => {
      if (prev.some((p) => p.id === profile.id)) return prev;
      return [...prev, profile];
    });

    try {
      const { error } = await follows.create(profile.id);
      if (error) throw error;
    } catch (err) {
      // Revert on error
      setFollowing((prev) => prev.filter((p) => p.id !== profile.id));
      throw err;
    }
  }, []);

  const unfollow = useCallback(async (userId: string) => {
    // Store for potential revert
    let removedProfile: Profile | undefined;

    // Optimistic update
    setFollowing((prev) => {
      removedProfile = prev.find((p) => p.id === userId);
      return prev.filter((p) => p.id !== userId);
    });

    try {
      const { error } = await follows.delete(userId);
      if (error) throw error;
    } catch (err) {
      // Revert on error
      if (removedProfile) {
        setFollowing((prev) => [...prev, removedProfile!]);
      }
      throw err;
    }
  }, []);

  const isFollowingUser = useCallback(
    (userId: string) => {
      return following.some((p) => p.id === userId);
    },
    [following]
  );

  // Fetch on mount
  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return (
    <FollowingContext.Provider
      value={{
        following,
        isLoading,
        error,
        fetchFollowing,
        follow,
        unfollow,
        isFollowingUser,
      }}
    >
      {children}
    </FollowingContext.Provider>
  );
}

export function useFollowing() {
  const context = useContext(FollowingContext);
  if (!context) {
    throw new Error("useFollowing must be used within a FollowingProvider");
  }
  return context;
}
