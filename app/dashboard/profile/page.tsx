import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  isParticipantProfileComplete,
  participantProfileEditPath,
} from "@/lib/workers/profile-completion";

export const metadata = { title: "Profile | MapAble Core" };

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Basic information about you. Sensitive details are protected.
        </p>
        {profile && !isParticipantProfileComplete(profile) ? (
          <p
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            role="status"
          >
            Complete your profile so coordinators and providers can match you
            with the right support.{" "}
            <Link
              href={participantProfileEditPath()}
              className="font-medium underline"
            >
              Finish profile
            </Link>
          </p>
        ) : null}
        <Link
          href="/dashboard/profile/edit"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Edit profile →
        </Link>
      </header>

      {profile ? (
        <dl className="grid max-w-xl gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <dt className="font-medium">Display name</dt>
            <dd>{profile.displayName}</dd>
          </div>
          {profile.preferredName ? (
            <div>
              <dt className="font-medium">Preferred name</dt>
              <dd>{profile.preferredName}</dd>
            </div>
          ) : null}
          {profile.homeSuburb || profile.homeState ? (
            <div>
              <dt className="font-medium">Location</dt>
              <dd>
                {[profile.homeSuburb, profile.homeState]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          ) : null}
          {profile.ndisParticipantNumberEnc ? (
            <div>
              <dt className="font-medium">NDIS number</dt>
              <dd>On file (masked for privacy)</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p>No profile yet. Use edit to create one.</p>
      )}
    </div>
  );
}
