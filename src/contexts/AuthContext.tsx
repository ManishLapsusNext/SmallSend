import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { userService } from "../services/userService";
import { UserProfile } from "../types";

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isPro: boolean;
  refreshProfile: () => Promise<void>;
  initializationError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const loadingRef = React.useRef(true);

  // Sync ref with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await userService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety fallback: ensure loading is NEVER stuck for more than 12 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.warn("Auth initialization timed out (12s safety fallback)");
        setLoading(false);
      }
    }, 12000);

    const initialize = async () => {
      try {
        // 1. Get initial session with a race to prevent indefinite hangs
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{
          data: { session: null };
          error: Error;
        }>((_, reject) =>
          setTimeout(
            () => reject(new Error("Supabase session timeout (10s)")),
            10000,
          ),
        );

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise as any, timeoutPromise as any]);

        if (error) throw error;
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err: any) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          // If it's a cold start/timeout, we don't necessarily treat it as a hard failure
          // but we log it. The app will proceed to login screen or dashboard.
          if (err.message?.includes("timeout")) {
            setInitializationError("connection_slow");
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initialize();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // If this was a login/logout event, we definitely want to stop loading
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const isPro = profile?.tier === "PRO" || profile?.tier === "PRO_PLUS";

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isPro,
        refreshProfile,
        initializationError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
