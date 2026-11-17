"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  normalizeAuthEmail,
  redirectAfterAuth,
} from "@/lib/auth/auth-flow";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";
import { clientAgentLog } from "@/lib/debug/client-agent-log";

export type SignInFormVariant = "page" | "header";

export const EMPTY_OAUTH_PROVIDER_FLAGS: OAuthProviderFlags = {
  auth0: false,
  google: false,
  microsoft: false,
  facebook: false,
  apple: false,
};

export function SignInForm({
  callbackUrl,
  oauthProviders = EMPTY_OAUTH_PROVIDER_FLAGS,
  variant = "page",
  idPrefix = "login",
  oauthError = null,
  resetSuccess = false,
}: {
  callbackUrl: string;
  oauthProviders?: OAuthProviderFlags;
  variant?: SignInFormVariant;
  idPrefix?: string;
  oauthError?: string | null;
  resetSuccess?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorPhoneHint, setTwoFactorPhoneHint] = useState("");
  const [passkeyEmail, setPasskeyEmail] = useState("");
  const [authMode, setAuthMode] = useState<"password" | "passkey">("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTwoFactorStep = Boolean(twoFactorToken);
  const isPasskeyMode = authMode === "passkey";
  const isHeader = variant === "header";
  const fieldGap = isHeader ? "flex flex-col gap-3" : "flex flex-col gap-4";
  const submitSize = isHeader ? "default" : "lg";
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const twoFactorId = `${idPrefix}-two-factor-code`;
  const passkeyEmailId = `${idPrefix}-passkey-email`;

  async function handlePasskeyLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const optionsResponse = await fetch("/api/passkeys/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeAuthEmail(passkeyEmail) }),
      });
      const optionsData = (await optionsResponse.json()) as {
        challengeToken?: string;
        error?: string;
        options?: Parameters<typeof startAuthentication>[0];
      };

      if (
        !optionsResponse.ok ||
        !optionsData.options ||
        !optionsData.challengeToken
      ) {
        setError(optionsData.error || "Could not start passkey sign-in.");
        setIsLoading(false);
        return;
      }

      const credential = await startAuthentication(optionsData.options);
      const verifyResponse = await fetch("/api/passkeys/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: optionsData.challengeToken,
          credential,
        }),
      });
      const verifyData = (await verifyResponse.json()) as {
        error?: string;
        signInToken?: string;
      };

      if (!verifyResponse.ok || !verifyData.signInToken) {
        setError(verifyData.error || "Passkey sign-in failed.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        passkeyToken: verifyData.signInToken,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Could not complete passkey sign-in. Please try again.");
        setIsLoading(false);
        return;
      }

      redirectAfterAuth(callbackUrl);
    } catch {
      setError("Passkey sign-in was cancelled or failed.");
      setIsLoading(false);
    }
  }

  const createAccount = (
    <>
      Don&apos;t have an account?{" "}
      <Link
        href="/register"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        Create one
      </Link>
    </>
  );

  const fields = (
    <>
      <div className={fieldGap}>
        <OAuthSignInButtons
          providers={oauthProviders}
          callbackUrl={callbackUrl}
          disabled={isLoading}
          labelMode="login"
        />
        <AuthOAuthDivider label="or sign in with email" />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setAuthMode(isPasskeyMode ? "password" : "passkey");
            setError("");
            setTwoFactorToken("");
          }}
        >
          {isPasskeyMode ? "Use email and password" : "Login with passkey"}
        </button>
      </div>

      {oauthError ? <AuthAlert variant="error">{oauthError}</AuthAlert> : null}

      {isPasskeyMode ? (
        <form className={fieldGap} onSubmit={handlePasskeyLogin}>
          <AccessibleFormField id={passkeyEmailId} label="Email" required>
            <input
              id={passkeyEmailId}
              name="email"
              type="email"
              autoComplete="email webauthn"
              value={passkeyEmail}
              onChange={(e) => setPasskeyEmail(e.target.value)}
              required
              disabled={isLoading}
              className={formInputClass}
            />
          </AccessibleFormField>

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <Button
            type="submit"
            variant="default"
            size={submitSize}
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Checking passkey…" : "Continue with passkey"}
          </Button>
        </form>
      ) : (
        <form
          className={fieldGap}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setIsLoading(true);

            try {
              if (isTwoFactorStep) {
                const verifyResponse = await fetch(
                  "/api/auth/twilio-2fa/verify",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      challengeToken: twoFactorToken,
                      code: twoFactorCode,
                    }),
                  },
                );

                const verifyData = (await verifyResponse.json()) as {
                  error?: string;
                  twoFactorToken?: string;
                };

                if (!verifyResponse.ok || !verifyData.twoFactorToken) {
                  setError(verifyData.error || "Invalid verification code");
                  setIsLoading(false);
                  return;
                }

                const result = await signIn("credentials", {
                  twoFactorToken: verifyData.twoFactorToken,
                  redirect: false,
                  callbackUrl,
                });

                if (result?.error) {
                  setError("Could not complete sign-in. Please try again.");
                  setIsLoading(false);
                  return;
                }

                redirectAfterAuth(callbackUrl);
                return;
              }

              const twoFactorResponse = await fetch(
                "/api/auth/twilio-2fa/start",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: normalizeAuthEmail(email),
                    password: password.trim(),
                  }),
                },
              );

              const twoFactorData = (await twoFactorResponse.json()) as {
                challengeToken?: string;
                error?: string;
                phoneHint?: string;
                required?: boolean;
              };

              if (!twoFactorResponse.ok) {
                setError(
                  twoFactorData.error ||
                    "Could not start two-factor authentication.",
                );
                setIsLoading(false);
                return;
              }

              if (twoFactorData.required) {
                if (!twoFactorData.challengeToken) {
                  setError("Could not start two-factor authentication.");
                  setIsLoading(false);
                  return;
                }
                setTwoFactorToken(twoFactorData.challengeToken);
                setTwoFactorPhoneHint(twoFactorData.phoneHint ?? "your phone");
                setTwoFactorCode("");
                setIsLoading(false);
                return;
              }

              const result = await signIn("credentials", {
                email: normalizeAuthEmail(email),
                password: password.trim(),
                redirect: false,
                callbackUrl,
              });

              clientAgentLog(
                "C",
                "SignInForm.tsx:signInResult",
                "signIn returned",
                {
                  ok: result?.ok ?? null,
                  error: result?.error ?? null,
                  status: result?.status ?? null,
                  callbackUrl,
                },
              );

              if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
                return;
              }

              if (result?.ok === true) {
                setIsLoading(false);
                redirectAfterAuth(callbackUrl);
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
          {isTwoFactorStep ? (
            <AccessibleFormField
              id={twoFactorId}
              label="Verification code"
              hint={`Enter the code sent to ${twoFactorPhoneHint}.`}
              required
            >
              <input
                id={twoFactorId}
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                disabled={isLoading}
                className={formInputClass}
              />
            </AccessibleFormField>
          ) : (
            <>
              <AccessibleFormField id={emailId} label="Email" required>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={formInputClass}
                />
              </AccessibleFormField>

              <AccessibleFormField
                id={passwordId}
                label="Password"
                required
              >
                <input
                  id={passwordId}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={formInputClass}
                />
              </AccessibleFormField>
            </>
          )}

          {resetSuccess ? (
            <AuthAlert variant="success">
              Your password was updated. Sign in with your new password.
            </AuthAlert>
          ) : null}

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              variant="default"
              size={submitSize}
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading
                ? "Signing in…"
                : isTwoFactorStep
                  ? "Verify and sign in"
                  : "Sign in"}
            </Button>
            {isTwoFactorStep ? (
              <button
                type="button"
                className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                disabled={isLoading}
                onClick={() => {
                  setTwoFactorToken("");
                  setTwoFactorCode("");
                  setTwoFactorPhoneHint("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </form>
      )}
    </>
  );

  if (isHeader) {
    return (
      <div className={fieldGap}>
        {fields}
        <p className="text-center text-sm text-muted-foreground">
          {createAccount}
        </p>
      </div>
    );
  }

  return (
    <AuthFormCard
      title="Welcome back"
      description="Sign in to your dashboard, bookings, and messages."
      footer={createAccount}
    >
      {fields}
    </AuthFormCard>
  );
}
