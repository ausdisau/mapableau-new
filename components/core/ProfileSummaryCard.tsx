import Link from "next/link";

import { roleLabel } from "@/lib/auth/roles";
import type { MapAbleUserRole } from "@prisma/client";

type Props = {
  displayName: string;
  email: string;
  role: MapAbleUserRole | string;
  profileHref?: string;
  settingsHref?: string;
};

export function ProfileSummaryCard({
  displayName,
  email,
  role,
  profileHref = "/dashboard/profile",
  settingsHref = "/dashboard/settings",
}: Props) {
  return (
    <section
      className="rounded-lg border border-border bg-card p-4"
      aria-labelledby="profile-summary-heading"
    >
      <h2 id="profile-summary-heading" className="font-heading text-lg font-semibold">
        Your profile
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as <strong>{displayName}</strong> ({email})
      </p>
      <p className="mt-1 text-sm">
        Role: <span className="font-medium">{roleLabel(role as MapAbleUserRole)}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={profileHref}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View profile
        </Link>
        <Link
          href={settingsHref}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Settings
        </Link>
      </div>
    </section>
  );
}
