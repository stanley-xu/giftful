import { supabase } from "@/supabase/client";
import { type Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth, auth as authHelpers, profiles } from "@/lib/api";
import { Profile } from "./schemas";

type SignInArgs = { email: string; password: string };

const AuthContext = createContext<{
  signIn: (args: SignInArgs) => void;
  signOut: () => void;
  signUp: (args: SignInArgs) => void;
  session?: Session | null;
  profile?: Profile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  // Need to expose this because the app can create profiles outside of the provider here
  setProfile: (profile: Profile | null) => void;
}>({
  signIn: () => null,
  signOut: () => null,
  signUp: () => null,
  session: null,
  profile: null,
  loading: false,
  error: null,
  clearError: () => null,
  setProfile: () => null,
});

export function useAuthContext() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("This component must be wrapped in a <AuthProvider />");
  }

  return value;
}

function useLoadingCallback<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  setLoading: (loading: boolean) => void
): (...args: Args) => Promise<T> {
  return useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      try {
        return await fn(...args);
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fn, setLoading]
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getSession = useCallback(async () => {
    const { data, error } = await auth.getSession();

    setSession(data ?? null);
    return { data, error };
  }, []);

  const getProfileByUserId = useCallback(async (userId: string) => {
    const { data, error } = await profiles.getByUserId(userId);

    setProfile(data ?? null);
    return { data, error };
  }, []);

  // Fetch the session once, and subscribe to auth state changes
  useEffect(() => {
    async function fetchExistingSessionAndProfile() {
      console.debug(`[fetchExistingSessionAndProfile]`);

      setLoading(true);
      try {
        const { data: session, error: sessionError } = await getSession();
        if (sessionError) throw sessionError;

        if (session) {
          console.debug("session detected");
          const { data, error } = await getProfileByUserId(session.user.id);
          if (error) {
            console.warn(`profile not found: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchExistingSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", {
        event: _event,
        user: { id: session?.user.id, email: session?.user.email },
      });
      // Don't await! Causes deadlock in supabase-js
      // See: https://github.com/supabase/auth-js/issues/762
      setSession(session ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle deep links for email verification
  // When user clicks email verification link, Supabase redirects to giftful://welcome#access_token=...&refresh_token=...
  useEffect(() => {
    const extractSessionFromUrl = async (url: string) => {
      // Only process auth callback URLs (contain token fragment)
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return;

      const params = new URLSearchParams(url.slice(hashIndex + 1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        // Best attempt at humanizing the Supabase error
        const errorMessage = `${error}: ${errorDescription}`;
        setError(errorMessage);
        return;
      }

      // Not an auth callback URL
      if (!access_token || !refresh_token) return;

      console.debug("[Deep Link] Extracting session from URL");
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setSessionError) {
        console.error(
          "[Deep Link] Failed to set session:",
          setSessionError.message
        );
      }
    };

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) extractSessionFromUrl(url);
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener("url", (e) =>
      extractSessionFromUrl(e.url)
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Handling loading states manually for now
    async function handleSessionChange(session: Session | null) {
      console.debug(
        `[handleSessionChange] received session: ${session?.user.id}`
      );

      setLoading(true);
      try {
        if (session) {
          console.debug("session detected");
          const { data, error } = await getProfileByUserId(session.user.id);
          if (error) {
            console.warn(`profile not found: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    handleSessionChange(session);
  }, [session]);

  const signUp = useLoadingCallback(async ({ email, password }: SignInArgs) => {
    const { data: session, error } = await authHelpers.signUp({
      email,
      password,
    });

    if (error) throw error;

    setSession(session ?? null);
    return session;
  }, setLoading);

  const signIn = useLoadingCallback(async ({ email, password }: SignInArgs) => {
    const { data: session, error } = await authHelpers.signIn({
      email,
      password,
    });

    if (error) throw error;
    if (!session) throw new Error("No session returned from sign in");

    setSession(session ?? null);
    return session;
  }, setLoading);

  const signOut = useLoadingCallback(async () => {
    const { error } = await authHelpers.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, setLoading);

  const value = useMemo(
    () => ({
      signIn,
      signOut,
      signUp,
      session,
      profile,
      loading,
      error,
      clearError,
      setProfile,
    }),
    [signIn, signOut, signUp, session, profile, loading, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
