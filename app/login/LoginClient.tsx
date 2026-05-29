"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackPath, getClientAppOrigin } from "@/lib/app-url";
import { buildRegisterRedirect } from "@/lib/auth/register-redirect";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

async function fetchSessionStatus(): Promise<
  | { status: "anonymous" }
  | { status: "unregistered"; email: string }
  | { status: "registered" }
> {
  const res = await fetch("/api/auth/session-status");
  if (!res.ok) return { status: "anonymous" };
  return res.json();
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = isSafeRedirect(rawCallback) ? rawCallback : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function resolveDestination(): Promise<string> {
    const sessionStatus = await fetchSessionStatus();
    if (sessionStatus.status === "unregistered") {
      return buildRegisterRedirect(sessionStatus.email, callbackUrl);
    }

    let destination = callbackUrl;
    if (callbackUrl === "/dashboard" || !searchParams.get("callbackUrl")) {
      try {
        const redirectRes = await fetch("/api/auth/post-login-redirect");
        const redirectData = await redirectRes.json();
        if (
          redirectRes.ok &&
          redirectData.redirectTo &&
          isSafeRedirect(redirectData.redirectTo)
        ) {
          destination = redirectData.redirectTo;
        }
      } catch {
        // fall back to callbackUrl
      }
    }
    return destination;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            const checkRes = await fetch(
              `/api/auth/check-registration?email=${encodeURIComponent(email)}`
            );
            const checkData = (await checkRes.json()) as { registered?: boolean };
            if (checkRes.ok && checkData.registered === false) {
              router.push(buildRegisterRedirect(email, callbackUrl));
              return;
            }

            setError("Invalid email or password");
            setIsLoading(false);
            return;
          }

          const destination = await resolveDestination();
          router.push(destination);
          router.refresh();
        } catch {
          setError("An error occurred. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          setError("");
          setIsLoading(true);
          try {
            const supabase = createClient();
            const redirectTo = `${getClientAppOrigin()}${getAuthCallbackPath(callbackUrl)}`;
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo },
            });
            if (oauthError) {
              setError(oauthError.message);
              setIsLoading(false);
            }
          } catch {
            setError("Unable to start OAuth sign-in.");
            setIsLoading(false);
          }
        }}
      >
        Continue with Google
      </button>
      {process.env.NEXT_PUBLIC_WIX_ENABLED === "true" ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            const params = new URLSearchParams({ returnTo: callbackUrl });
            window.location.href = `/api/auth/wix/login?${params.toString()}`;
          }}
        >
          Continue with Wix
        </button>
      ) : null}
    </form>
  );
}
