import Link from "next/link";

import { WorkerProfileForm } from "@/components/forms/WorkerProfileForm";
import { requirePermission } from "@/lib/auth/guards";
import { getPrimaryWorkerProfileForUser } from "@/lib/workers/worker-profile-service";
import { workerOnboardingPath } from "@/lib/workers/profile-completion";

export default async function WorkerProfileEditPage() {
  const user = await requirePermission("profile:write:self");
  const profile = await getPrimaryWorkerProfileForUser(user.id);

  if (!profile) {
    return (
      <p>
        <Link href={workerOnboardingPath()} className="underline">
          Start onboarding
        </Link>{" "}
        to create your worker profile.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Edit profile</h1>
      <WorkerProfileForm
        initial={{
          displayName: profile.displayName,
          profileSummary: profile.profileSummary,
          serviceTypes: profile.serviceTypes,
          serviceRegions: profile.serviceRegions,
          specialisations: profile.specialisations,
          languages: profile.languages,
          qualificationsSummary: profile.qualificationsSummary,
        }}
      />
      <Link href="/worker/profile" className="text-sm underline">
        Back to profile
      </Link>
    </div>
  );
}
