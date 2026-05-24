import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import {
  logParticipantDashboardAccess,
  resolveParticipantAccess,
} from "@/lib/participant/participant-access";
import { getParticipantProfileSummary } from "@/lib/participant/participant-dashboard-service";

type ParticipantProfilePageProps = {
  searchParams: Promise<{ participantId?: string }>;
};

export default async function ParticipantProfilePage({
  searchParams,
}: ParticipantProfilePageProps) {
  const user = await requireAuth("/login");
  const params = await searchParams;
  const access = await resolveParticipantAccess(user, params.participantId);

  if (!access) {
    redirect("/dashboard");
  }

  await logParticipantDashboardAccess(
    user,
    access.participantId,
    access.viewAsDelegate,
    "profile",
  );

  const summary = await getParticipantProfileSummary(access.participantId);
  if (!summary) {
    redirect("/participant");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Your profile</h1>
        <p className="text-muted-foreground">
          Basic account details. Sensitive NDIS or health records are not stored
          on this page.
        </p>
      </header>

      <dl className="space-y-4 rounded-xl border border-border/60 bg-card p-6 text-sm">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd className="mt-1 font-medium text-foreground">
            {summary.profile?.preferredName ??
              summary.profile?.displayName ??
              summary.user.name}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-1 font-medium text-foreground">
            {summary.user.email}
          </dd>
        </div>
        {summary.user.phone ? (
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-1 font-medium text-foreground">
              {summary.user.phone}
            </dd>
          </div>
        ) : null}
        {summary.profile?.homeSuburb ? (
          <div>
            <dt className="text-muted-foreground">Home area</dt>
            <dd className="mt-1 font-medium text-foreground">
              {[summary.profile.homeSuburb, summary.profile.homeState]
                .filter(Boolean)
                .join(", ")}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Accessibility profile</dt>
          <dd className="mt-1 font-medium text-foreground">
            {summary.accessibilityConfigured ? "Started" : "Not set up yet"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/profile/edit"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Edit participant profile
        </Link>
        <Link
          href="/participant"
          className="inline-flex min-h-11 items-center rounded-lg border border-input px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
