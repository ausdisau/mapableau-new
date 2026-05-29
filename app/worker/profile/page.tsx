import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { getPrimaryWorkerProfileForUser } from "@/lib/workers/worker-profile-service";
import {
  isWorkerProfileComplete,
  workerOnboardingPath,
} from "@/lib/workers/profile-completion";

export default async function WorkerProfilePage() {
  const user = await requirePermission("profile:read:self");
  const profile = await getPrimaryWorkerProfileForUser(user.id);

  if (!profile) {
    return (
      <p className="text-muted-foreground">
        No worker profile linked.{" "}
        <Link href={workerOnboardingPath()} className="underline">
          Complete onboarding
        </Link>
      </p>
    );
  }

  if (!isWorkerProfileComplete(profile)) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Your profile is incomplete.{" "}
        <Link href={workerOnboardingPath()} className="font-medium underline">
          Finish onboarding
        </Link>
      </p>
    );
  }

  const awaitingVerification =
    profile.verificationStatus !== "verified";

  return (
    <div className="space-y-6 max-w-xl">
      {awaitingVerification && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          Your profile is complete. Shift and timesheet features unlock after
          an administrator verifies your worker profile (current status:{" "}
          {profile.verificationStatus}).
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Your profile</h1>
        <Link href="/worker/profile/edit" className="text-sm underline">
          Edit
        </Link>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Display name</dt>
          <dd>{profile.displayName}</dd>
        </div>
        {profile.profileSummary && (
          <div>
            <dt className="font-medium text-muted-foreground">About</dt>
            <dd>{profile.profileSummary}</dd>
          </div>
        )}
        {profile.qualificationsSummary && (
          <div>
            <dt className="font-medium text-muted-foreground">
              Qualifications
            </dt>
            <dd>{profile.qualificationsSummary}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-muted-foreground">Service types</dt>
          <dd>{profile.serviceTypes.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Regions</dt>
          <dd>{profile.serviceRegions.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Verification</dt>
          <dd>{profile.verificationStatus}</dd>
        </div>
      </dl>
    </div>
  );
}
