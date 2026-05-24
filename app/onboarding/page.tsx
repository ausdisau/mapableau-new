import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAuth } from "@/lib/auth/guards";
import { ensureOnboardingStatus } from "@/lib/auth/role-onboarding-router";

export default async function OnboardingPage() {
  const user = await requireAuth("/login?returnTo=/onboarding");
  const onboarding = await ensureOnboardingStatus(user.id);

  if (onboarding.onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-bold">Welcome to MapAble</h1>
        <p className="mt-2 text-muted-foreground">
          Your sign-in confirms your identity only. MapAble will guide you through
          role selection and any required verification before granting portal
          access.
        </p>
        <Link
          href="/onboarding/role"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Choose how you use MapAble
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
