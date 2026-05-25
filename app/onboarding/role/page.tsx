import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { RoleSelectionForm } from "@/components/registration/RoleSelectionForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-status-service";

export default async function OnboardingRolePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/onboarding/role");

  const status = await getOnboardingStatus(user.id);
  if (status.hasRole && status.complete) redirect("/dashboard");

  return (
    <AuthShell
      title="Choose your role"
      description="This helps us show the right tools. Some roles need verification before offering services."
    >
      <OnboardingProgress step={1} total={3} label="Your role" />
      <RoleSelectionForm />
    </AuthShell>
  );
}
