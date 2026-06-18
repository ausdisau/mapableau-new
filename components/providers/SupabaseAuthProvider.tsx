"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(
    async (options?: { callbackUrl?: string }) => {
      await supabase.auth.signOut();
      window.location.href = options?.callbackUrl ?? "/login";
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      signOut,
    }),
    [session, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within SupabaseAuthProvider");
  }
  return context;
}

/** Compatibility shim for components that still call useSession from next-auth. */
export function useSession() {
  const { session, status } = useAuth();
  const metadata = session?.user?.user_metadata as
    | { prismaUserId?: string; name?: string; full_name?: string }
    | undefined;

  return {
    data: session
      ? {
          user: {
            id: metadata?.prismaUserId ?? session.user.id,
            email: session.user.email,
            name: metadata?.name ?? metadata?.full_name ?? null,
          },
        }
      : null,
    status,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOAuth(
  provider: "google" | "azure" | "facebook" | "apple",
  callbackUrl: string,
) {
  const supabase = createSupabaseBrowserClient();
  const origin = window.location.origin;
  const next = encodeURIComponent(callbackUrl);
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${next}`,
    },
  });
}
