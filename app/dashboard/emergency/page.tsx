import Link from "next/link";

import { CheckInPanel } from "@/components/emergency/CheckInPanel";
import { DisasterAlertBanner } from "@/components/emergency/DisasterAlertBanner";
import { requirePermission } from "@/lib/auth/guards";
import { listActiveAlerts } from "@/lib/emergency/alert-service";
import { getEmergencyProfile } from "@/lib/emergency/profile-service";

export const metadata = { title: "Emergency | MapAble" };

export default async function EmergencyHubPage() {
  const user = await requirePermission("emergency:read:self");
  const [profile, alerts] = await Promise.all([
    getEmergencyProfile(user.id),
    listActiveAlerts("NSW"),
  ]);

  const contactCount = profile?.contacts.length ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">MapAble Emergency</h1>
        <p className="text-muted-foreground max-w-2xl">
          Emergency readiness: contacts, evacuation plans, check-ins, and transport
          escalation. For life-threatening emergencies, call 000 first.
        </p>
      </header>

      <DisasterAlertBanner alerts={alerts} />

      <CheckInPanel />

      <nav
        aria-label="Emergency sections"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Link
          href="/dashboard/emergency/profile"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Emergency profile</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Mobility, communication, pickup address
          </p>
        </Link>
        <Link
          href="/dashboard/emergency/contacts"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Trusted contacts</span>
          <p className="mt-1 text-sm text-muted-foreground">
            {contactCount} contact{contactCount === 1 ? "" : "s"} on file
          </p>
        </Link>
        <Link
          href="/dashboard/emergency/plans"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Evacuation plans</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Home, work, and meeting points
          </p>
        </Link>
        <Link
          href="/dashboard/emergency/notes"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Critical access notes</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Medication, equipment, access instructions
          </p>
        </Link>
        <Link
          href="/dashboard/emergency/transport"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Emergency transport</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Request priority transport via MapAble
          </p>
        </Link>
        <Link
          href="/dashboard/emergency/alerts"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="font-medium">Disaster alerts</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Regional subscriptions
          </p>
        </Link>
      </nav>
    </div>
  );
}
