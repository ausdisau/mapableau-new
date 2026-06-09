import Link from "next/link";
import { redirect } from "next/navigation";

import { ContinuityTimelinePanel } from "@/components/participant/ContinuityTimelinePanel";
import { Y1WedgePilotNav } from "@/components/pilot/Y1WedgePilotNav";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getActiveY1UxPaths,
  isUserInY1PilotCohort,
  isY1WedgePilotActive,
} from "@/lib/pilot/y1-wedge-pilot";

export default async function PilotDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isY1WedgePilotActive() || !isUserInY1PilotCohort(user.email)) {
    redirect("/dashboard");
  }

  const paths = getActiveY1UxPaths();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Trust wedge pilot</h1>
        <p className="mt-1 text-muted-foreground">
          Consent-driven support profile, explainable matching, and backup
          recovery — aligned to the MapAble masterplan Year 1 wedge.
        </p>
      </header>

      <Y1WedgePilotNav paths={paths} />

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Continuity timeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A single thread of bookings, care, transport, and orchestration events.
        </p>
        <div className="mt-4">
          <ContinuityTimelinePanel />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
        <h2 className="font-semibold">Quick links</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <Link href="/dashboard/support-profile" className="text-primary hover:underline">
              Support profile
            </Link>
          </li>
          <li>
            <Link href="/dashboard/care" className="text-primary hover:underline">
              Care dashboard
            </Link>
          </li>
          <li>
            <Link href="/dashboard/safety/incidents/new" className="text-primary hover:underline">
              Report a concern
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
