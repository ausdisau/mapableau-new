"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginLegacyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("returnTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
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

          if (result?.ok) {
            router.push(callbackUrl);
            router.refresh();
            return;
          }

          setError("An unexpected error occurred.");
        } catch {
          setError("An error occurred. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <div>
        <label htmlFor="legacy-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="legacy-email"
          className="w-full rounded-md border border-input px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="legacy-password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="legacy-password"
          className="w-full rounded-md border border-input px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-secondary px-4 py-2 text-sm font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Signing in…" : "Sign in with credentials"}
      </button>
    </form>
  );
}
