"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

type Props = {
  providers: OAuthProviderFlags;
  callbackUrl: string;
  disabled?: boolean;
  labelMode?: OAuthButtonLabelMode;
};

export type OAuthButtonLabelMode = "continue" | "login";

export function getOAuthButtonLabel(
  providerName: string,
  labelMode: OAuthButtonLabelMode = "continue",
) {
  return `${labelMode === "login" ? "Login" : "Continue"} with ${providerName}`;
}

export function OAuthSignInButtons({
  providers,
  callbackUrl,
  disabled = false,
  labelMode = "continue",
}: Props) {
  const [pending, setPending] = useState<
    "auth0" | "google" | "microsoft" | "facebook" | null
  >(null);

  if (
    !providers.auth0 &&
    !providers.google &&
    !providers.microsoft &&
    !providers.facebook
  ) {
    return null;
  }

  const startOAuth = (
    provider: "auth0" | "google" | "azure-ad" | "facebook",
  ) => {
    setPending(
      provider === "auth0"
        ? "auth0"
        : provider === "google"
          ? "google"
          : provider === "facebook"
            ? "facebook"
            : "microsoft",
    );
    void signIn(provider, { callbackUrl });
  };

  const oauthButtonClass = "w-full justify-center";

  return (
    <div className="flex flex-col gap-2">
      {providers.auth0 ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null}
          loading={pending === "auth0"}
          onClick={() => startOAuth("auth0")}
        >
          {pending === "auth0"
            ? "Redirecting…"
            : getOAuthButtonLabel("Auth0", labelMode)}
        </Button>
      ) : null}
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
          {pending === "google"
            ? "Redirecting…"
            : getOAuthButtonLabel("Google", labelMode)}
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
            : getOAuthButtonLabel("Microsoft", labelMode)}
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
            : getOAuthButtonLabel("Facebook", labelMode)}
        </Button>
      ) : null}
    </div>
  );
}
