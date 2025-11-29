/**
 * Seed script for local development
 * Uses the official Supabase Admin API to create test users
 *
 * Run with: npx tsx supabase/seed.ts
 */

import { createClient } from "@supabase/supabase-js";

// Local Supabase connection
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "dev@example.com",
    password: "dev@example.com",
    name: "Dev",
    bio: "You break, I fix",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "alice@example.com",
    password: "alice@example.com",
    name: "Alice",
    bio: "Hi there, I'm Alice ^_^",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "bob@example.com",
    password: "bob@example.com",
    name: "Bob",
    bio: "Just a regular Bob",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "charlie@example.com",
    password: "charlie@example.com",
    name: "Charlie",
    bio: "Coffee enthusiast ☕",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "diana@example.com",
    password: "diana@example.com",
    name: "Diana",
    bio: "Book lover and tea addict",
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    email: "ethan@example.com",
    password: "ethan@example.com",
    name: "Ethan",
    bio: "Gaming is life",
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    email: "fiona@example.com",
    password: "fiona@example.com",
    name: "Fiona",
    bio: "Photography & travel",
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    email: "george@example.com",
    password: "george@example.com",
    name: "George",
    bio: "Foodie extraordinaire",
  },
  {
    id: "00000000-0000-0000-0000-000000000009",
    email: "hannah@example.com",
    password: "hannah@example.com",
    name: "Hannah",
    bio: "Yoga and mindfulness",
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    email: "ivan@example.com",
    password: "ivan@example.com",
    name: "Ivan",
    bio: "Tech geek",
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    email: "julia@example.com",
    password: "julia@example.com",
    name: "Julia",
    bio: "Artist & designer",
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    email: "kevin@example.com",
    password: "kevin@example.com",
    name: "Kevin",
    bio: "Music producer",
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    email: "laura@example.com",
    password: "laura@example.com",
    name: "Laura",
    bio: "Plant mom",
  },
  {
    id: "00000000-0000-0000-0000-000000000014",
    email: "mike@example.com",
    password: "mike@example.com",
    name: "Mike",
    bio: "Sports fanatic",
  },
  {
    id: "00000000-0000-0000-0000-000000000015",
    email: "nina@example.com",
    password: "nina@example.com",
    name: "Nina",
    bio: "Fashion lover",
  },
];

async function seed() {
  console.log("🌱 Seeding test users...\n");

  for (const user of testUsers) {
    console.log(`Creating user: ${user.email}`);

    // Create user with admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          name: user.name,
        },
      });

    if (authError && authError.code !== "email_exists") {
      console.error(`  ❌ Error creating auth user: ${authError.message}`);
      continue;
    }

    console.log(`  ✅ Auth user created`);

    // Create profile in public.profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name: user.name,
      bio: user.bio,
    });

    if (profileError) {
      console.error(`  ❌ Error creating profile: ${profileError.message}`);
    } else {
      console.log(`  ✅ Profile created`);
    }

    // Create default wishlist
    // Mirrors the single wishlist stage of the app.
    // TODO: remove this once multi-wishlist is implemented
    const { data: wishlistData, error: wishlistError } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        name: "My Wishlist",
        visibility: "follower", // Default to private visibility
      })
      .select()
      .single();

    if (wishlistError) {
      console.error(`  ❌ Error creating wishlist: ${wishlistError.message}`);
    } else {
      console.log(`  ✅ Default wishlist created`);

      // Add dummy wishlist items for development
      const dummyItems = Array.from({ length: 10 }, (_, index) => ({
        wishlist_id: wishlistData.id,
        name: `Item ${index}`,
        description: `Description ${index}`,
        url: "https://www.google.com",
        order: index,
        status: null,
      }));

      const { error: itemsError } = await supabase
        .from("wishlist_items")
        .insert(dummyItems);

      if (itemsError) {
        console.error(`  ❌ Error creating dummy items: ${itemsError.message}`);
      } else {
        console.log(`  ✅ Created ${dummyItems.length} dummy wishlist items`);
      }
    }

    console.log("");
  }

  // Create follow relationships - Dev follows everyone else
  console.log("Creating follow relationships...");
  const devId = "00000000-0000-0000-0000-000000000001";
  const followees = testUsers.filter((u) => u.id !== devId);

  const followInserts = followees.map((followee) => ({
    follower_id: devId,
    following_id: followee.id,
  }));

  const { error: followError } = await supabase
    .from("follows")
    .insert(followInserts);

  if (followError) {
    console.error(`  ❌ Error creating follows: ${followError.message}`);
  } else {
    console.log(`  ✅ Dev now follows ${followees.length} users`);
  }
  console.log("");

  console.log("✨ Seeding complete!\n");
  console.log("Test users:");
  testUsers.forEach((u) => console.log(`  - ${u.email} / ${u.password}`));
}

seed().catch(console.error);
