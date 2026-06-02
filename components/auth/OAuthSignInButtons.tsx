"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getNeonAuthClient } from "@/lib/auth/neon-auth-client";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

type Props = {
  providers: OAuthProviderFlags;
  callbackUrl: string;
  disabled?: boolean;
  neonAuthEnabled?: boolean;
};

export function OAuthSignInButtons({
  providers,
  callbackUrl,
  disabled = false,
  neonAuthEnabled = false,
}: Props) {
  const [pending, setPending] = useState<
    "google" | "microsoft" | "facebook" | null
  >(null);

  const showGoogle = neonAuthEnabled || providers.google;
  const showMicrosoft = !neonAuthEnabled && providers.microsoft;
  const showFacebook = !neonAuthEnabled && providers.facebook;

  if (!showGoogle && !showMicrosoft && !showFacebook) {
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
    if (neonAuthEnabled && provider === "google") {
      void getNeonAuthClient().signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
      return;
    }
    void signIn(provider, { callbackUrl });
  };

  const oauthButtonClass = "w-full justify-center";

  return (
    <div className="flex flex-col gap-2">
      {showGoogle ? (
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
      {showMicrosoft ? (
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
      {showFacebook ? (
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
