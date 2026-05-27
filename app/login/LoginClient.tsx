"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { isSafeRedirect } from "@/lib/auth/safe-redirect";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = isSafeRedirect(rawCallback) ? rawCallback : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
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
    </form>
  );
}

