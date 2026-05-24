"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import { Button } from "@/components/ui/button";

type LoginClientProps = {
  oauthProviders?: string[];
};

function buildAuthCompleteUrl(callbackUrl: string) {
  if (callbackUrl.startsWith("/auth/complete")) return callbackUrl;
  const url = new URL("/auth/complete", window.location.origin);
  if (callbackUrl && callbackUrl !== "/dashboard") {
    url.searchParams.set("next", callbackUrl);
  }
  return `${url.pathname}${url.search}`;
}

export default function LoginClient({
  oauthProviders = [],
}: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = buildAuthCompleteUrl(rawCallback);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <section aria-labelledby="login-email-heading" className="space-y-4">
        <h2 id="login-email-heading" className="text-sm font-semibold">
          Continue with email
        </h2>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setInfo("");
            setIsLoading(true);

            try {
              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
              });

              if (result?.error) {
                setError("Invalid email or password.");
                setIsLoading(false);
                return;
              }

              if (result?.ok === true) {
                setIsLoading(false);
                router.push(callbackUrl);
                router.refresh();
                return;
              }

              setError("Something went wrong. Please try again.");
              setIsLoading(false);
            } catch {
              setError("Something went wrong. Please try again.");
              setIsLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="login-email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="login-password"
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div
            aria-live="polite"
            aria-atomic="true"
            className="min-h-[1.25rem] space-y-1"
          >
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in with email"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isLoading}
          onClick={() => {
            setInfo(
              "Email magic links are coming soon. Use your password or Google/Microsoft sign-in for now.",
            );
          }}
        >
          Send me a sign-in link
        </Button>
      </section>

      <OAuthSignInButtons
        callbackUrl={callbackUrl}
        providers={oauthProviders}
      />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/register" className="underline underline-offset-2">
          Create an account
        </Link>
        {" · "}
        <a
          href="mailto:support@mapable.com.au?subject=Account%20access%20help"
          className="underline underline-offset-2"
        >
          I cannot access my account
        </a>
      </p>

      <p className="text-xs text-muted-foreground">
        Google and Microsoft sign-in only verify that you control that account.
        Your MapAble role and provider verification are managed separately in
        MapAble Core.
      </p>
    </div>
  );
}
