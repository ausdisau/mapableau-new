import { Suspense } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getConfiguredOAuthProviderIds } from "@/lib/auth/oauth-providers";

export const metadata = {
  title: "Sign in | MapAble",
  description: "Sign in to MapAble Core for care, transport and support.",
};

export default function LoginPage() {
  const oauthProviders = getConfiguredOAuthProviderIds();

  return (
    <AuthShell productMessage="Welcome back. Your support, transport and care tools are ready when you are.">
      <AuthCard
        title="Sign in"
        description="Use your email or a connected Google or Microsoft account. Social sign-in does not set your provider or admin permissions."
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground" role="status">
              Loading sign-in form…
            </p>
          }
        >
          <LoginForm oauthProviders={oauthProviders} />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
