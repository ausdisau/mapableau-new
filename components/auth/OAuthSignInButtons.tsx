"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

type Props = {
  providers: OAuthProviderFlags;
  callbackUrl: string;
  disabled?: boolean;
};

export function OAuthSignInButtons({
  providers,
  callbackUrl,
  disabled = false,
}: Props) {
  const [pending, setPending] = useState<
    "google" | "microsoft" | "facebook" | null
  >(null);

  if (!providers.google && !providers.microsoft && !providers.facebook) {
    return null;
  }

  const startOAuth = (provider: "google" | "azure-ad" | "facebook") => {
    setPending(
      provider === "google"
        ? "google"
        : provider === "facebook"
          ? "facebook"
          : "microsoft"
    );
    void signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex flex-col gap-2">
      {providers.google ? (
        <button
          type="button"
          disabled={disabled || pending !== null}
          onClick={() => startOAuth("google")}
          className="rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
      ) : null}
      {providers.microsoft ? (
        <button
          type="button"
          disabled={disabled || pending !== null}
          onClick={() => startOAuth("azure-ad")}
          className="rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {pending === "microsoft"
            ? "Redirecting…"
            : "Continue with Microsoft"}
        </button>
      ) : null}
      {providers.facebook ? (
        <button
          type="button"
          disabled={disabled || pending !== null}
          onClick={() => startOAuth("facebook")}
          className="rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {pending === "facebook"
            ? "Redirecting…"
            : "Continue with Facebook"}
        </button>
      ) : null}
    </div>
  );
}
