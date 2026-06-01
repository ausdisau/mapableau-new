"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

export default function RegisterClient({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderFlags;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasOAuth =
    oauthProviders.google ||
    oauthProviders.microsoft ||
    oauthProviders.facebook;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
          name,
        }),
      });

      const data = (await res.json()) as { error?: string; code?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: password.trim(),
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(
          "Account created, but sign-in failed. Try signing in on the login page."
        );
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col gap-6">
      {hasOAuth ? (
        <div className="flex flex-col gap-4">
          <OAuthSignInButtons
            providers={oauthProviders}
            callbackUrl="/dashboard"
            disabled={isLoading}
          />
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-background px-2">
              or register with email
            </span>
            <span
              className="absolute left-0 right-0 top-1/2 border-t border-border"
              aria-hidden
            />
          </div>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          disabled={isLoading}
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded bg-blue-600 py-2 text-white disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Creating account…" : "Register"}
        </button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
