"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

  const oauthButtonClass = "w-full justify-center";

  return (
    <div className="flex flex-col gap-2">
      {providers.google ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null}
          loading={pending === "google"}
          onClick={() => startOAuth("google")}
        >
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
      ) : null}
      {providers.microsoft ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null}
          loading={pending === "microsoft"}
          onClick={() => startOAuth("azure-ad")}
        >
          {pending === "microsoft"
            ? "Redirecting…"
            : "Continue with Microsoft"}
        </Button>
      ) : null}
      {providers.facebook ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null}
          loading={pending === "facebook"}
          onClick={() => startOAuth("facebook")}
        >
          {pending === "facebook"
            ? "Redirecting…"
            : "Continue with Facebook"}
        </Button>
      ) : null}
    </div>
  );
}
