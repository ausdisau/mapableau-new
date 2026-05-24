import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getConfiguredOAuthProviderIds } from "@/lib/auth/oauth-providers";

export const metadata = {
  title: "Create account | MapAble",
  description: "Create your MapAble account and choose how you use the platform.",
};

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviderIds();

  return (
    <AuthShell productMessage="Join MapAble — accessible care, transport and support in one place.">
      <AuthCard
        title="Create your account"
        description="Tell us how you use MapAble. We only ask for basic details now — not NDIS plans or health records."
      >
        <RegisterForm oauthProviders={oauthProviders} />
      </AuthCard>
    </AuthShell>
  );
}
