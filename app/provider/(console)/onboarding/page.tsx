import Link from "next/link";

import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { ProviderNdisRegistrationForm } from "@/components/provider/ProviderNdisRegistrationForm";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";

export const metadata = { title: "Provider onboarding | MapAble" };

export default async function ProviderOnboardingPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Provider onboarding</h1>
      <p className="text-muted-foreground">
        Signed in as {roleLabel(user.primaryRole)}. Complete verification and
        organisation checks before workers can be matched to participants.
      </p>
      <OnboardingChecklist />
      {orgIds[0] ? (
        <ProviderNdisRegistrationForm organisationId={orgIds[0]} />
      ) : null}
      <Link
        href="/provider"
        className="inline-block text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to control panel
      </Link>
    </div>
  );
}
