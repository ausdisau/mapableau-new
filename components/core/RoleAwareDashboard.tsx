import Link from "next/link";

import { defaultDashboardPath, roleLabel } from "@/lib/auth/roles";
import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

import { NotificationBell } from "./NotificationBell";
import { ProfileSummaryCard } from "./ProfileSummaryCard";

type QuickLink = { href: string; title: string; description: string };

const ROLE_QUICK_LINKS: Partial<Record<UserRole, QuickLink[]>> = {
  participant: [
    {
      href: "/dashboard/bookings",
      title: "Bookings",
      description: "Care, transport and combined journeys",
    },
    {
      href: "/dashboard/care",
      title: "Care",
      description: "Request and manage support shifts",
    },
    {
      href: "/dashboard/transport",
      title: "Transport",
      description: "Accessible transport trips",
    },
    {
      href: "/bookings/bundles/new",
      title: "Care + transport bundle",
      description: "Coordinate support and travel together",
    },
  ],
  provider_admin: [
    {
      href: "/provider/bookings",
      title: "Booking queue",
      description: "Respond to participant requests",
    },
    {
      href: "/provider/workers",
      title: "Workers",
      description: "Manage your support team",
    },
    {
      href: "/provider/compliance",
      title: "Compliance",
      description: "Documents and verification",
    },
  ],
  support_coordinator: [
    {
      href: "/support-coordinator/participants",
      title: "Caseload",
      description: "Participants who have granted consent",
    },
    {
      href: "/support-coordinator/referrals",
      title: "Referrals",
      description: "Create and track referrals",
    },
  ],
  driver: [
    {
      href: "/driver/trips",
      title: "Today's trips",
      description: "Start, update and complete trips",
    },
  ],
  mapable_admin: [
    {
      href: "/admin",
      title: "Admin home",
      description: "Platform operations",
    },
    {
      href: "/admin/compliance",
      title: "Compliance",
      description: "Consent, screening and incidents",
    },
    {
      href: "/admin/matching-debug",
      title: "Matching debug",
      description: "Test match inputs and outputs",
    },
  ],
};

type Props = {
  displayName: string;
  email: string;
  role: MapAbleUserRole | UserRole | string;
  unreadNotifications?: number;
};

export function RoleAwareDashboard({
  displayName,
  email,
  role,
  unreadNotifications = 0,
}: Props) {
  const links =
    ROLE_QUICK_LINKS[role as UserRole] ??
    ROLE_QUICK_LINKS.participant ??
    [];

  const homePath = defaultDashboardPath(role as UserRole);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome, {displayName}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            You are signed in as a {roleLabel(role as MapAbleUserRole)}. Use the links below for your
            most common tasks.
          </p>
        </div>
        <NotificationBell initialUnread={unreadNotifications} />
      </header>

      <ProfileSummaryCard
        displayName={displayName}
        email={email}
        role={role}
        settingsHref={
          role === "mapable_admin" ? "/admin" : "/dashboard/profile"
        }
      />

      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="font-heading text-xl font-semibold">
          Quick links
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block min-h-[88px] rounded-lg border border-border p-4 transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="font-medium">{link.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Your role home:{" "}
        <Link href={homePath} className="text-primary underline">
          {homePath}
        </Link>
      </p>
    </div>
  );
}
