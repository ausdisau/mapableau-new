import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAuth } from "@/lib/auth/guards";

export default async function OnboardingVerificationPage() {
  await requireAuth("/login?returnTo=/onboarding/verification");

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-bold">Verification required</h1>
        <p className="mt-2 text-muted-foreground">
          Your selected role requires MapAble verification and approval. Auth0
          sign-in confirms your identity only — it does not approve you as a
          provider, worker, driver or administrator.
        </p>
        <p className="mt-4 text-sm">
          Our team will review your application. You can continue using participant
          features while verification is pending where applicable.
        </p>
      </AuthCard>
    </AuthShell>
  );
}
