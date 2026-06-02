"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Button } from "@/components/ui/button";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

type Props = {
  providers: OAuthProviderFlags;
  callbackUrl: string;
  disabled?: boolean;
  /** Show Google on login even before env is configured (button disabled until ready). */
  showGoogleButton?: boolean;
  onGoogleUnavailable?: () => void;
};

export function OAuthSignInButtons({
  providers,
  callbackUrl,
  disabled = false,
  showGoogleButton = false,
  onGoogleUnavailable,
}: Props) {
  const [pending, setPending] = useState<
    "google" | "microsoft" | "facebook" | null
  >(null);

  const showGoogle = showGoogleButton || providers.google;
  const googleReady = providers.google;

  if (!showGoogle && !providers.microsoft && !providers.facebook) {
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

  const startGoogle = () => {
    if (!googleReady) {
      onGoogleUnavailable?.();
      return;
    }
    startOAuth("google");
  };

  const oauthButtonClass = "w-full justify-center gap-2";

  return (
    <div className="flex flex-col gap-2">
      {showGoogle ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null || !googleReady}
          loading={pending === "google"}
          onClick={startGoogle}
          aria-label="Sign in with Google"
        >
          <GoogleIcon className="shrink-0" />
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
