/**
 * Type-safe database helpers using Zod + Supabase
 *
 * Pattern:
 * 1. Use Zod schemas for validation at API boundaries
 * 2. Supabase handles the DB interaction
 * 3. Validate responses before returning to app code
 */

import { supabase } from "@/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { PostgRESTErrorCodes } from "../data/postgres-errors";
import {
  CreateProfile,
  ProfileSchema,
  ShareTokenValidationSchema,
  UpdateProfile,
  UpdateProfileSchema,
  WishlistItemSchema,
  WishlistSchema,
  type CreateWishlist,
  type CreateWishlistItem,
  type Profile,
  type UpdateWishlist,
  type UpdateWishlistItem,
  type Wishlist,
  type WishlistItem,
} from "./schemas";

// ============================================================================
// Generic helper types
// ============================================================================

type DbResult<T> = {
  data?: T | null;
  error: Error | null;
};

type DbListResult<T> = {
  data: T[] | null;
  error: Error | null;
};

// ============================================================================
// Auth
// ============================================================================

export const auth = {
  /**
   * Get session
   * @returns The session or null if there is no session
   */
  async getSession(): Promise<DbResult<Session | null>> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      return { data: session, error: null };
    } catch (error) {
      console.error("Error fetching session:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<DbResult<User>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user");

      return { data: user, error: null };
    } catch (error) {
      console.error("Error fetching current user:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Sign up a new user with email and password
   */
  async signUp({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<DbResult<Session>> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "giftful://welcome",
        },
      });

      if (error) throw error;

      // Note: this is to be expected if the user is not verified yet
      if (!session) {
        console.warn(`[Sign Up] check email for verification link`);
      }

      return { data: session, error: null };
    } catch (error) {
      console.error("Error signing up:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<DbResult<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No session returned from sign in");
      }

      return { data: data.session, error: null };
    } catch (error) {
      console.error("Error signing in:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<DbResult<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Resend verification email to the given email address
   */
  async resendVerificationEmail(email: string): Promise<DbResult<boolean>> {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: "giftful://welcome",
        },
      });

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error("Error resending verification email:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Profiles
// ============================================================================

export const profiles = {
  /**
   * Get user profile by ID
   */
  async getById(id: string): Promise<DbResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const validated = ProfileSchema.parse(data);
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error fetching user:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentProfile(): Promise<DbResult<Profile>> {
    try {
      const { data: currentUser, error: getCurrentUserError } =
        await auth.getCurrentUser();

      if (!currentUser || getCurrentUserError) {
        return { data: null, error: getCurrentUserError };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      if (!data) {
        return { data: null, error: null };
      }

      const validated = ProfileSchema.parse(data);
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get user profile by user ID
   */
  async getByUserId(userId: string): Promise<DbResult<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // No rows found - expected for new users without profiles
      if (error && error.code === PostgRESTErrorCodes.NO_ROWS) {
        return { data: null, error: null };
      }

      if (error) throw error;
      if (!data) {
        return { data: null, error: null };
      }

      const validated = ProfileSchema.parse(data);
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error fetching user profile by user ID:", error);
      return { data: null, error: error as Error };
    }
  },

  async createProfile(data: CreateProfile): Promise<DbResult<Profile>> {
    try {
      const { data: currentUser, error: getCurrentUserError } =
        await auth.getCurrentUser();

      if (!currentUser || getCurrentUserError) {
        throw new Error(
          `[createProfile] failed to retrieve current user: ${getCurrentUserError}`
        );
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .insert({
          id: currentUser.id,
          name: data.name,
          bio: data.bio || null,
          avatar_url: data.avatar_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      const validated = ProfileSchema.parse(profileData);
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error creating user profile:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update the current user's profile
   * @param data - The profile data to update
   * Note: Only the image path is used and stored in supabase
   * @returns The updated profile
   */
  async updateProfile(data: UpdateProfile): Promise<DbResult<Profile>> {
    try {
      const { data: currentUser, error: getCurrentUserError } =
        await auth.getCurrentUser();

      if (getCurrentUserError) throw getCurrentUserError;
      if (!currentUser) throw new Error("No current user");

      const validated = UpdateProfileSchema.parse(data);
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update(validated)
        .eq("id", currentUser.id)
        .select()
        .single();

      if (updateProfileError) throw updateProfileError;
      if (!updatedProfile) throw new Error("No updated profile");

      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Avatar Images
// ============================================================================

export const avatarImage = {
  /**
   * Get avatar image by path
   */
  async getByPath(path: string): Promise<DbResult<Blob | null>> {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching avatar image:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Upload an avatar image
   */
  async upload(
    imageUri: string,
    imageMimeType?: string
  ): Promise<DbResult<{ id: string; path: string; fullPath: string } | null>> {
    console.debug(
      `[upload] imageUri: ${imageUri}, imageMimeType: ${imageMimeType}`
    );

    try {
      const arraybuffer = await fetch(imageUri).then((res) =>
        res.arrayBuffer()
      );
      const fileExt = imageUri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const path = `${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arraybuffer, {
          contentType: imageMimeType ?? "image/jpeg",
        });

      if (uploadError) throw uploadError;

      return { data, error: null };
    } catch (error) {
      console.error("Error uploading avatar image:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Wishlists
// ============================================================================

export const wishlists = {
  /**
   * Get all wishlists for current user
   */
  async getAll(): Promise<DbListResult<Wishlist>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validated = data?.map((w) => WishlistSchema.parse(w)) ?? [];
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get all wishlists for a specific user by userId
   */
  async getByUserId(userId: string): Promise<DbListResult<Wishlist>> {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validated = data?.map((w) => WishlistSchema.parse(w)) ?? [];
      return { data: validated, error: null };
    } catch (error) {
      console.error("Error fetching wishlists by user ID:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get wishlist by ID with items
   */
  async getById(
    id: string
  ): Promise<DbResult<Wishlist & { items: WishlistItem[] }>> {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*, wishlist_items(*)")
        .eq("id", id)
        .single();

      if (error) throw error;

      const wishlist = WishlistSchema.parse(data);
      const items = (data.wishlist_items ?? [])
        .map((item: unknown) => WishlistItemSchema.parse(item))
        .sort((a: WishlistItem, b: WishlistItem) => a.order - b.order);

      return { data: { ...wishlist, items }, error: null };
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Create a new wishlist
   */
  async create(data: CreateWishlist): Promise<DbResult<Wishlist>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { data: wishlist, error } = await supabase
        .from("wishlists")
        .insert({
          user_id: currentUser.id,
          name: data.name,
          event_id: data.event_id || null,
          visibility: data.visibility || "private",
        })
        .select()
        .single();

      if (error) throw error;

      return { data: WishlistSchema.parse(wishlist), error: null };
    } catch (error) {
      console.error("Error creating wishlist:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update a wishlist
   */
  async update(id: string, data: UpdateWishlist): Promise<DbResult<Wishlist>> {
    try {
      const { data: wishlist, error } = await supabase
        .from("wishlists")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: WishlistSchema.parse(wishlist), error: null };
    } catch (error) {
      console.error("Error updating wishlist:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Delete a wishlist
   */
  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const { error } = await supabase.from("wishlists").delete().eq("id", id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Wishlist Items
//
// IMPORTANT: Item Ordering Semantics
// -----------------------------------
// The `order` field represents an item's "natural position within its section"
// (pinned vs unpinned), NOT its absolute visual position in the list.
//
// Visual order is determined by a multi-key sort:
//   1. Primary: status = 'pinned' (pinned items first)
//   2. Secondary: order ASC (within each section)
//
// This means:
// - Pinning/unpinning only toggles status, no order changes needed
// - Items maintain their relative order within their section
// - See docs/records/pinning-semantics.md for detailed examples
// ============================================================================

export const wishlistItems = {
  /**
   * Get all items for a wishlist
   *
   * Items are sorted with pinned items first, then by order within each section.
   * This implements the multi-key sorting described in docs/records/pinning-semantics.md
   */
  async getByWishlistId(wishlistId: string): Promise<DbResult<WishlistItem[]>> {
    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .order("order", { ascending: true });

      if (error) throw error;

      // Sort in-memory: pinned items first, then by order within each section
      const sorted = data.sort((a, b) => {
        // Primary sort: pinned items first
        const aIsPinned = a.status === "pinned";
        const bIsPinned = b.status === "pinned";
        if (aIsPinned !== bIsPinned) {
          return aIsPinned ? -1 : 1;
        }
        // Secondary sort: by order within section
        return a.order - b.order;
      });

      return {
        data: sorted.map((item) => WishlistItemSchema.parse(item)),
        error: null,
      };
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Add item to wishlist
   */
  async create(
    wishlistId: string,
    data: CreateWishlistItem
  ): Promise<DbResult<WishlistItem>> {
    try {
      // Get max order for this wishlist
      const { data: maxOrderResult } = await supabase
        .from("wishlist_items")
        .select("order")
        .eq("wishlist_id", wishlistId)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = data.order ?? (maxOrderResult?.order ?? -1) + 1;

      const { data: item, error } = await supabase
        .from("wishlist_items")
        .insert({
          wishlist_id: wishlistId,
          name: data.name,
          url: data.url || null,
          description: data.description || null,
          order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: WishlistItemSchema.parse(item), error: null };
    } catch (error) {
      console.error("Error creating wishlist item:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Add many items to wishlist
   */
  async createMany(
    wishlistId: string,
    items: CreateWishlistItem[]
  ): Promise<DbResult<WishlistItem[]>> {
    try {
      if (items.length === 0) {
        return { data: [], error: null };
      }

      // Get max order for this wishlist
      const { data: maxOrderResult } = await supabase
        .from("wishlist_items")
        .select("order")
        .eq("wishlist_id", wishlistId)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const startOrder = (maxOrderResult?.order ?? 0) + 1;

      const insertData = items.map((item, index) => ({
        wishlist_id: wishlistId,
        name: item.name,
        url: item.url || null,
        description: item.description || null,
        order: startOrder + index,
      }));

      const { data: createdItems, error } = await supabase
        .from("wishlist_items")
        .insert(insertData)
        .select();

      if (error) throw error;

      return {
        data: createdItems.map((item) => WishlistItemSchema.parse(item)),
        error: null,
      };
    } catch (error) {
      console.error("Error creating wishlist items:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update a wishlist item
   */
  async update(
    id: string,
    data: UpdateWishlistItem
  ): Promise<DbResult<WishlistItem>> {
    try {
      const { data: item, error } = await supabase
        .from("wishlist_items")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: WishlistItemSchema.parse(item), error: null };
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Delete a wishlist item
   */
  async delete(id: string): Promise<DbResult<boolean>> {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Reorder items in a wishlist
   */
  async reorder(
    wishlistId: string,
    itemIds: string[]
  ): Promise<DbResult<boolean>> {
    try {
      const updates = itemIds.map((id, index) =>
        supabase.from("wishlist_items").update({ order: index }).eq("id", id)
      );

      await Promise.all(updates);
      return { data: true, error: null };
    } catch (error) {
      console.error("Error reordering wishlist items:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Toggle pin status of a wishlist item
   * Pinned items have status='pinned', unpinned items have status=NULL
   */
  async togglePin(id: string): Promise<DbResult<WishlistItem>> {
    try {
      // First get the current item to know its status
      const { data: currentItem, error: fetchError } = await supabase
        .from("wishlist_items")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const newStatus: string | null =
        currentItem.status === "pinned" ? null : "pinned";

      const { data: item, error } = await supabase
        .from("wishlist_items")
        .update({ status: newStatus } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: WishlistItemSchema.parse(item), error: null };
    } catch (error) {
      console.error("Error toggling pin status:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Share Tokens - Wishlist Sharing
// ============================================================================

export const shareTokens = {
  /**
   * Generate or get existing share token for a wishlist
   * Creates a new token if one doesn't exist, or returns existing active token
   */
  async findOrCreate(wishlistId: string): Promise<DbResult<string>> {
    try {
      // Check if token already exists
      const { data: existing } = await supabase
        .from("wishlist_permissions")
        .select("share_token")
        .eq("wishlist_id", wishlistId)
        .single();

      if (existing?.share_token) {
        return { data: existing.share_token, error: null };
      }

      // Create new token
      const { data, error } = await supabase
        .from("wishlist_permissions")
        .insert({ wishlist_id: wishlistId })
        .select("share_token")
        .single();

      if (error) throw error;
      if (!data?.share_token) throw new Error("Failed to generate token");

      return { data: data.share_token, error: null };
    } catch (error) {
      console.error("Error generating share token:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Validate a share token for a given wishlist ID
   * Returns true if the token is valid and active for that wishlist
   */
  async validateFor(
    wishlistId: string,
    token: string
  ): Promise<DbResult<boolean>> {
    try {
      // Validate input types first
      const validationResult = ShareTokenValidationSchema.safeParse({
        wishlistId,
        token,
      });

      if (!validationResult.success) {
        return {
          data: false,
          error: new Error(`Invalid input: ${validationResult.error.message}`),
        };
      }

      const { data, error } = await supabase
        .from("wishlist_permissions")
        .select("id")
        .eq("wishlist_id", wishlistId)
        .eq("share_token", token)
        .single();

      if (error) {
        // Token not found is not an error, just return false
        if (error.code === PostgRESTErrorCodes.NO_ROWS) {
          return { data: false, error: null };
        }
        throw error;
      }

      return { data: !!data, error: null };
    } catch (error) {
      console.error("Error validating share token:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Follows - User Following Relationships
// ============================================================================

export const follows = {
  /**
   * Follow a user
   */
  async create(followingId: string): Promise<DbResult<boolean>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      // Check if already following
      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", followingId)
        .single();

      if (existing) {
        // Already following, return success
        return { data: true, error: null };
      }

      const { error } = await supabase.from("follows").insert({
        follower_id: currentUser.id,
        following_id: followingId,
      });

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error("Error following user:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Unfollow a user
   */
  async delete(followingId: string): Promise<DbResult<boolean>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", followingId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Check if current user is following another user
   */
  async isFollowing(followingId: string): Promise<DbResult<boolean>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", followingId)
        .single();

      if (error && error.code !== PostgRESTErrorCodes.NO_ROWS) {
        throw error;
      }

      return { data: !!data, error: null };
    } catch (error) {
      console.error("Error checking follow status:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get list of users the current user is following
   */
  async getFollowing(): Promise<DbListResult<Profile>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { data, error } = await supabase
        .from("follows")
        .select("following_id, profiles!follows_following_id_fkey(*)")
        .eq("follower_id", currentUser.id);

      if (error) throw error;

      const profiles =
        data
          ?.map((row: any) => row.profiles)
          .filter((p: any) => p !== null)
          .map((p: any) => ProfileSchema.parse(p)) ?? [];

      return { data: profiles, error: null };
    } catch (error) {
      console.error("Error fetching following list:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get list of users following the current user
   */
  async getFollowers(): Promise<DbListResult<Profile>> {
    try {
      const { data: currentUser, error: userError } =
        await auth.getCurrentUser();
      if (!currentUser || userError) throw userError || new Error("No user");

      const { data, error } = await supabase
        .from("follows")
        .select("follower_id, profiles!follows_follower_id_fkey(*)")
        .eq("following_id", currentUser.id);

      if (error) throw error;

      const profiles =
        data
          ?.map((row: any) => row.profiles)
          .filter((p: any) => p !== null)
          .map((p: any) => ProfileSchema.parse(p)) ?? [];

      return { data: profiles, error: null };
    } catch (error) {
      console.error("Error fetching followers list:", error);
      return { data: null, error: error as Error };
    }
  },
};

// ============================================================================
// Events - Full CRUD example
// ============================================================================

// ============================================================================
// Participants
// ============================================================================
