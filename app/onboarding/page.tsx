import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-status-service";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/onboarding");

  const status = await getOnboardingStatus(user.id);
  if (!status.hasRole) redirect("/onboarding/role");
  if (status.complete) redirect("/dashboard");

  return (
    <AuthShell
      title="Complete your profile"
      description="A few details help providers support you safely."
    >
      <OnboardingProgress step={2} total={3} label="Profile basics" />
      <p className="text-slate-700 text-sm">
        Continue to your dashboard area to add access needs and preferences when
        ready. Sensitive details like your NDIS number are optional.
      </p>
      <a
        href={status.nextStepPath}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-white font-medium"
      >
        Continue
      </a>
    </AuthShell>
  );
}
