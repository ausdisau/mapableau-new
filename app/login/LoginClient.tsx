"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { clientAgentLog } from "@/lib/debug/client-agent-log";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
          const result = await signIn("credentials", {
            email: email.trim().toLowerCase(),
            password: password.trim(),
            redirect: false,
            callbackUrl,
          });

          // #region agent log
          clientAgentLog(
            "C",
            "LoginClient.tsx:signInResult",
            "signIn returned",
            {
              ok: result?.ok ?? null,
              error: result?.error ?? null,
              status: result?.status ?? null,
              callbackUrl,
            }
          );
          // #endregion

          if (result?.error) {
            setError("Invalid email or password");
            setIsLoading(false);
            return;
          }

          if (result?.ok === true) {
            setIsLoading(false);
            router.push(callbackUrl);
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
      {resetSuccess ? (
        <p className="text-sm text-green-700">
          Your password was updated. Sign in with your new password.
        </p>
      ) : null}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

