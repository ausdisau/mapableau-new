"use client";

import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

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

export function oauthProviderFlagsFromNextAuthProviders(
  providerIds: Iterable<string>,
): OAuthProviderFlags {
  const ids = new Set(providerIds);

  return {
    workosAuthKit: ids.has("workos-authkit"),
    auth0: ids.has("auth0"),
    google: ids.has("google"),
    microsoft: ids.has("azure-ad"),
    facebook: ids.has("facebook"),
    apple: ids.has("apple"),
  };
}

/** Only surface OAuth providers that NextAuth has actually registered. */
export function publicOAuthProviderFlags(
  providers: OAuthProviderFlags,
): OAuthProviderFlags {
  return { ...providers };
}

export function OAuthSignInButtons({
  providers,
  callbackUrl,
  disabled = false,
  labelMode = "continue",
}: Props) {
  const [runtimeProviders, setRuntimeProviders] =
    useState<OAuthProviderFlags>(providers);
  const [pending, setPending] = useState<
    | "workos-authkit"
    | "auth0"
    | "google"
    | "microsoft"
    | "facebook"
    | "apple"
    | null
  >(null);
  const visibleProviders = publicOAuthProviderFlags(runtimeProviders);

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeProviders() {
      try {
        const response = await fetch("/api/auth/providers", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as Record<string, unknown>;
        if (cancelled) return;

        setRuntimeProviders(
          oauthProviderFlagsFromNextAuthProviders(Object.keys(data)),
        );
      } catch {
        // Keep the server-provided flags when the runtime provider probe fails.
      }
    }

    void loadRuntimeProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  if (
    !visibleProviders.workosAuthKit &&
    !visibleProviders.auth0 &&
    !visibleProviders.google &&
    !visibleProviders.microsoft &&
    !visibleProviders.facebook &&
    !visibleProviders.apple
  ) {
    return null;
  }

  const startOAuth = (
    provider:
      | "workos-authkit"
      | "auth0"
      | "google"
      | "azure-ad"
      | "facebook"
      | "apple",
  ) => {
    setPending(provider === "azure-ad" ? "microsoft" : provider);
    void signIn(
      provider,
      { callbackUrl },
      provider === "workos-authkit"
        ? { screen_hint: labelMode === "login" ? "sign-in" : "sign-up" }
        : undefined,
    );
  };

  const oauthButtonClass = "w-full justify-center";

  return (
    <div
      className="flex flex-col gap-2"
      role="group"
      aria-label="Secure account options"
      aria-busy={pending !== null}
    >
      <span className="sr-only" aria-live="polite">
        {pending ? "Opening secure sign-in…" : ""}
      </span>
      {visibleProviders.workosAuthKit ? (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="default"
            className="w-full justify-center bg-[#075985] text-white hover:bg-[#0b4a6f] focus-visible:ring-[#075985]"
            disabled={disabled || pending !== null}
            loading={pending === "workos-authkit"}
            aria-describedby="workos-authkit-help"
            onClick={() => startOAuth("workos-authkit")}
          >
            <ShieldCheck aria-hidden="true" />
            {pending === "workos-authkit"
              ? "Opening secure sign-in…"
              : labelMode === "login"
                ? "Sign in securely with MapAble"
                : "Create account securely with MapAble"}
          </Button>
          <p
            id="workos-authkit-help"
            className="px-1 text-center text-xs leading-relaxed text-muted-foreground"
          >
            Opens MapAble&apos;s secure sign-in page, powered by WorkOS.
          </p>
        </div>
      ) : null}
      {visibleProviders.auth0 ? (
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
      {visibleProviders.google ? (
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
      {visibleProviders.microsoft ? (
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
      {visibleProviders.facebook ? (
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
      {visibleProviders.apple ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={oauthButtonClass}
          disabled={disabled || pending !== null}
          loading={pending === "apple"}
          onClick={() => startOAuth("apple")}
        >
          {pending === "apple"
            ? "Redirecting…"
            : getOAuthButtonLabel("Apple", labelMode)}
        </Button>
      ) : null}
    </div>
  );
}
