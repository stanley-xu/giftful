/**
 * Supabase client for React Native
 *
 * IMPORTANT: The react-native-url-polyfill import MUST come first.
 * React Native doesn't have native URL/URLSearchParams APIs that Supabase requires.
 * Without this polyfill, all database queries will silently hang.
 *
 * See https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth
 */

// Verify the polyfill loaded correctly
import "react-native-url-polyfill/auto";
const hasURL = typeof URL !== "undefined";
const hasURLSearchParams = typeof URLSearchParams !== "undefined";
if (!hasURL || !hasURLSearchParams) {
  throw new Error(`
    URL polyfill failed to load. Supabase requires react-native-url-polyfill. 
    Ensure it's installed and imported before @supabase/supabase-js.
    Has URL: ${hasURL}
    Has URLSearchParams: ${hasURLSearchParams}
  `);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { Database } from "./database.types";

import { DB_CONFIG } from "@/config";
import validate from "./validations";

validate();

export const supabase = createClient<Database>(DB_CONFIG.URL, DB_CONFIG.KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
