import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { getCurrentUser } from "@/lib/auth/current-user";
import { resolvePostAuthRoute } from "@/lib/auth/role-router";
import { getOnboardingStatus } from "@/lib/onboarding/onboarding-status-service";
import { roleLabel } from "@/lib/auth/roles";

export default async function OnboardingCompletePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const status = await getOnboardingStatus(user.id);
  if (!status.hasRole) redirect("/onboarding/role");

  const route = await resolvePostAuthRoute(user);

  return (
    <AuthShell title="You're set up" description="Here's what happens next.">
      <OnboardingProgress step={3} total={3} label="Done" />
      {status.pendingApproval ? (
        <p className="text-slate-800" role="status">
          Your {roleLabel(user.primaryRole)} role is pending verification. You can
          explore MapAble while we review your details.
        </p>
      ) : (
        <p className="text-slate-800" role="status">
          Your account is ready. Continue to your home area.
        </p>
      )}
      <a
        href={route.path}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-white font-medium"
      >
        Go to MapAble
      </a>
    </AuthShell>
  );
}
