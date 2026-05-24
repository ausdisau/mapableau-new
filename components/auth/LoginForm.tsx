"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Button } from "@/components/ui/button";

const inputClassName =
  "min-h-12 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base shadow-sm outline-none transition focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

type LoginFormProps = {
  oauthProviders?: string[];
};

export function LoginForm({ oauthProviders = [] }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/auth/complete";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <AuthErrorSummary errors={errors} />

      {info ? (
        <p className="text-sm text-muted-foreground" role="status">
          {info}
        </p>
      ) : null}

      <SocialLoginButtons
        callbackUrl={callbackUrl}
        providers={oauthProviders}
      />

      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setErrors([]);
          setInfo("");

          if (useMagicLink) {
            setInfo(
              "Email magic links are coming soon. Please use your password or Google/Microsoft sign-in for now.",
            );
            return;
          }

          if (!email.trim()) {
            setErrors(["Enter your email address."]);
            return;
          }
          if (!password) {
            setErrors(["Enter your password."]);
            return;
          }

          setIsLoading(true);
          try {
            const result = await signIn("credentials", {
              email: email.trim().toLowerCase(),
              password,
              redirect: false,
              callbackUrl,
            });

            if (result?.error) {
              setErrors([
                "We could not sign you in. Check your email and password, or create an account.",
              ]);
              setIsLoading(false);
              return;
            }

            if (result?.ok) {
              router.push(callbackUrl);
              router.refresh();
              return;
            }

            setErrors(["Something went wrong. Please try again."]);
            setIsLoading(false);
          } catch {
            setErrors(["Something went wrong. Please try again."]);
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
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
        </div>

        {!useMagicLink ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Link
                href="mailto:support@mapable.com.au?subject=Password%20reset"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isLoading}
          onClick={() => setUseMagicLink((v) => !v)}
        >
          {useMagicLink ? "Use password instead" : "Send me a sign-in link"}
        </Button>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to MapAble?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
