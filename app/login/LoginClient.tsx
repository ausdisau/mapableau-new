"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import { Button } from "@/components/ui/button";

type LoginClientProps = {
  oauthProviders?: string[];
};

export default function LoginClient({
  oauthProviders = [],
}: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <OAuthSignInButtons
        callbackUrl={callbackUrl}
        providers={oauthProviders}
      />

      <form
        className="space-y-4"
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
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="login-password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="default"
          size="default"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Sign in with email"}
        </Button>
      </form>
    </div>
  );
}
