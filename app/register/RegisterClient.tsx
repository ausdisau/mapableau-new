"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  RegistrationChatDialogue,
  type RegistrationInvitePreview,
} from "@/components/registration/RegistrationChatDialogue";
import type { RegistrationSessionFields } from "@/components/registration/types";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { registrationErrorMessage } from "@/lib/registration/validation";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

export default function RegisterClient({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderFlags;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken")?.trim() ?? "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitePreview, setInvitePreview] =
    useState<RegistrationInvitePreview | null>(null);
  const [inviteLoadError, setInviteLoadError] = useState("");

  useEffect(() => {
    if (!inviteToken) return;

    let cancelled = false;

    async function loadInvite() {
      try {
        const res = await fetch(`/api/worker-invites/${encodeURIComponent(inviteToken)}`);
        const data = (await res.json()) as {
          invite?: RegistrationInvitePreview;
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok || !data.invite) {
          setInviteLoadError(data.error || "Could not load invite details.");
          return;
        }

        setInvitePreview(data.invite);
      } catch {
        if (!cancelled) {
          setInviteLoadError("Could not load invite details.");
        }
      }
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const handleRegister = useCallback(
    async (session: RegistrationSessionFields) => {
      setError("");
      setIsLoading(true);

      const normalizedEmail = normalizeAuthEmail(session.email);

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: session.password.trim(),
            name: session.name,
            ...(inviteToken ? { inviteToken } : {}),
          }),
        });

        const data = (await res.json()) as { error?: string; code?: string };

        if (!res.ok) {
          setError(
            registrationErrorMessage(data.code, data.error || "Registration failed"),
          );
          setIsLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email: normalizedEmail,
          password: session.password.trim(),
          redirect: false,
          callbackUrl: "/dashboard",
        });

        if (result?.error) {
          setError(
            "Account created, but sign-in failed. Try signing in on the login page.",
          );
          setIsLoading(false);
          return;
        }

        router.push(inviteToken ? "/worker/onboarding" : "/dashboard");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsLoading(false);
      }
    },
    [inviteToken, router],
  );

  return (
    <AuthFormCard
      title={inviteToken ? "Create worker account" : "Create your account"}
      description={
        inviteToken
          ? "Complete registration to accept your provider invite and join their roster."
          : "Join MapAble to request care, manage bookings, and connect with providers."
      }
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

      {inviteLoadError ? (
        <AuthAlert variant="error">{inviteLoadError}</AuthAlert>
      ) : null}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <RegistrationChatDialogue
        inviteToken={inviteToken}
        invitePreview={invitePreview}
        onRegister={handleRegister}
        isRegistering={isLoading}
      />
    </AuthFormCard>
  );
}
