"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";
import type { Y1WedgeConfig } from "@/lib/config/y1-wedge";
import type { UserRole } from "@/types/mapable";

const LINKS = [
  { href: "/dashboard", label: "Control panel", exact: true },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/accessibility", label: "Accessibility" },
  { href: "/dashboard/consent", label: "Consent" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/care", label: "Care", matchPrefix: "/care" },
  { href: "/dashboard/transport", label: "Transport trips", matchPrefix: "/dashboard/transport" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/find-support", label: "Find support" },
  { href: "/dashboard/find-transport", label: "Find transport" },
  { href: "/dashboard/timesheets", label: "Timesheets" },
  { href: "/dashboard/safety", label: "Safety centre" },
  { href: "/dashboard/engagement", label: "Your voice" },
  { href: "/dashboard/cases", label: "Cases (AI)" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/billing", label: "Billing centre" },
  { href: "/dashboard/settings/notifications", label: "Notification settings" },
];

export function DashboardNav({
  role,
  wedgeFlags,
}: {
  userName: string;
  role: UserRole;
  wedgeFlags: Y1WedgeConfig;
}) {
  const pathname = usePathname();
  const wedgeLinks = [
    ...(wedgeFlags.supportProfileEnabled
      ? [{ href: "/dashboard/support-profile", label: "Support profile" }]
      : []),
    ...(wedgeFlags.participantMatchReviewEnabled
      ? [{ href: "/dashboard/care", label: "Care matches", matchPrefix: "/dashboard/care/matches" }]
      : []),
  ];
  const links = [
    ...LINKS,
    ...wedgeLinks,
    ...(role === "mapable_admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <MapAbleRoleNav
      label="Dashboard"
      title="Your control panel"
      links={links.map((link) => ({
        href: link.href,
        label: link.label,
        exact: "exact" in link ? link.exact : undefined,
        matchPrefix: "matchPrefix" in link ? link.matchPrefix : link.href,
      }))}
      trailing={
        pathname.startsWith("/provider-finder") ? null : (
          <Link
            href="/provider-finder"
            className="text-sm font-black text-[#005B7F] hover:underline"
          >
            Find support
          </Link>
        )
      }
    />
  );
}
