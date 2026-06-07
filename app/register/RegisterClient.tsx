"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import {
  completeCredentialTwoFactor,
  startCredentialTwoFactor,
} from "@/lib/auth/credential-two-factor-client";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

export default function RegisterClient({
  oauthProviders,
  twilio2FAEnabled,
}: {
  oauthProviders: OAuthProviderFlags;
  twilio2FAEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorPhoneHint, setTwoFactorPhoneHint] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTwoFactorStep = Boolean(twoFactorToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      if (isTwoFactorStep) {
        const result = await completeCredentialTwoFactor({
          challengeToken: twoFactorToken,
          code: twoFactorCode,
        });

        if (!result.ok) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
          name,
          phone: phone.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string; code?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      const startResult = await startCredentialTwoFactor({
        email: normalizedEmail,
        password,
      });

      if (startResult.kind === "two-factor-required") {
        setTwoFactorToken(startResult.challengeToken);
        setTwoFactorPhoneHint(startResult.phoneHint);
        setTwoFactorCode("");
        setIsLoading(false);
        return;
      }

      if (startResult.kind === "error") {
        setError(
          startResult.error ||
            "Account created, but sign-in failed. Try signing in on the login page.",
        );
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <AuthFormCard
      title="Create your account"
      description="Join MapAble to request care, manage bookings, and connect with providers."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OAuthSignInButtons
          providers={oauthProviders}
          callbackUrl="/dashboard"
          disabled={isLoading}
        />
        <AuthOAuthDivider label="or register with email" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isTwoFactorStep ? (
          <AccessibleFormField
            id="register-two-factor-code"
            label="Verification code"
            hint={`Enter the code sent to ${twoFactorPhoneHint}.`}
            required
          >
            <input
              id="register-two-factor-code"
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
            <AccessibleFormField id="register-name" label="Name" required>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className={formInputClass}
              />
            </AccessibleFormField>

            <AccessibleFormField id="register-email" label="Email" required>
              <input
                id="register-email"
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
              id="register-phone"
              label="Mobile number"
              required={twilio2FAEnabled}
              hint={
                twilio2FAEnabled
                  ? "Used for SMS verification when you sign in."
                  : "Optional. Used if two-factor authentication is enabled."
              }
            >
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={twilio2FAEnabled}
                disabled={isLoading}
                className={formInputClass}
                placeholder="0412 345 678"
              />
            </AccessibleFormField>

            <AccessibleFormField
              id="register-password"
              label="Password"
              required
              hint="At least 8 characters."
            >
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={isLoading}
                className={formInputClass}
              />
            </AccessibleFormField>
          </>
        )}

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading
            ? "Creating account…"
            : isTwoFactorStep
              ? "Verify and continue"
              : "Create account"}
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
            Start over
          </button>
        ) : null}
      </form>
    </AuthFormCard>
  );
}
