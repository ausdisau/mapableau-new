import { Suspense } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { SecurePortalNotice } from "@/components/auth/SecurePortalNotice";
import { getAuthEnv } from "@/lib/config/auth-env";

import LoginLegacyClient from "./LoginLegacyClient";
import LoginReturnTo from "./LoginReturnTo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LoginPageContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const env = getAuthEnv();

  return (
    <>
      <header className="mb-6 space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          MapAble secure portal
        </p>
        <h1 id="auth-card-heading" className="text-3xl font-bold tracking-tight">
          Sign in
        </h1>
        <p className="text-muted-foreground">
          You are signing in securely through Australian Disability Ltd.
        </p>
      </header>

      <SecurePortalNotice />

      <AuthCard className="mt-6">
        <Suspense fallback={null}>
          <LoginReturnTo fallback="/dashboard">
            {(returnTo) => (
              <LoginForm
                returnTo={returnTo}
                error={params.error ?? null}
                showLegacyCredentials={env.AUTH_ENABLE_LEGACY_CREDENTIALS}
              />
            )}
          </LoginReturnTo>
        </Suspense>

        {env.AUTH_ENABLE_LEGACY_CREDENTIALS && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="mb-3 text-sm font-semibold">Developer credentials</h2>
            <LoginLegacyClient />
          </div>
        )}
      </AuthCard>
    </>
  );
}
