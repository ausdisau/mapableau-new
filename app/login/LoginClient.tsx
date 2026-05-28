"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Auth0SocialSignIn } from "@/components/auth/Auth0SocialSignIn";
import type { Auth0SocialConnection } from "@/lib/auth/auth0-social-connections";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

type LoginClientProps = {
  auth0SocialConnections?: Auth0SocialConnection[];
};

export default function LoginClient({
  auth0SocialConnections = [],
}: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = isSafeRedirect(rawCallback) ? rawCallback : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-4">
      {auth0SocialConnections.length > 0 ? (
        <>
          <Auth0SocialSignIn
            connections={auth0SocialConnections}
            callbackUrl={callbackUrl}
            disabled={isLoading}
            onError={() => setError("")}
          />
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-background px-2">or sign in with email</span>
          </div>
        </>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setIsLoading(true);

          try {
            const result = await signIn("credentials", {
              email,
              password,
              redirect: false,
              callbackUrl,
            });

            if (result?.error) {
              setError("Invalid email or password");
              setIsLoading(false);
              return;
            }

            if (result?.ok === true) {
              setIsLoading(false);
              let destination = callbackUrl;
              if (
                callbackUrl === "/dashboard" ||
                !searchParams.get("callbackUrl")
              ) {
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
              router.push(destination);
              router.refresh();
              return;
            }

            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
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
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? "Signing in…" : "Sign in with email"}
        </button>
      </form>
    </div>
  );
}
