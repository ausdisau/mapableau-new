"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { AuthErrorSummary } from "./AuthErrorSummary";

interface LoginFormProps {
  returnTo?: string;
  error?: string | null;
  showLegacyCredentials?: boolean;
}

export function LoginForm({
  returnTo = "/dashboard",
  error,
  showLegacyCredentials = false,
}: LoginFormProps) {
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const errors = error ? [mapAuthError(error)] : [];

  return (
    <div className="space-y-6">
      <AuthErrorSummary errors={errors} />

      <div aria-live="polite" className="space-y-4">
        <Button asChild variant="default" size="lg" className="w-full">
          <a href={loginHref}>Sign in securely</a>
        </Button>

        {showLegacyCredentials && (
          <p className="text-center text-xs text-muted-foreground">
            Developer seed accounts can still use the legacy credentials form on
            this page when enabled.
          </p>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Need help?{" "}
        <Link href="/support" className="font-medium text-primary underline-offset-4 hover:underline">
          Contact MapAble support
        </Link>
      </p>
    </div>
  );
}

function mapAuthError(code: string): string {
  switch (code) {
    case "auth":
      return "We could not complete sign-in. Please try again.";
    case "missing_identity":
      return "Your identity provider did not return the required email address.";
    case "missing_profile":
      return "We could not connect your sign-in to a MapAble profile.";
    default:
      return "Something went wrong during sign-in.";
  }
}
