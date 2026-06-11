"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";
import type { UserRole } from "@/types/mapable";

const ALL_LINKS = [
  { href: "/coordinate", label: "Home", exact: true },
  { href: "/coordinate/plan", label: "Your plan" },
  { href: "/coordinate/goals", label: "Goals & actions" },
  { href: "/coordinate/providers", label: "Providers" },
  { href: "/coordinate/budget", label: "Budget" },
  { href: "/coordinate/reviews", label: "Review queue", roles: ["support_coordinator", "plan_manager", "mapable_admin"] as UserRole[] },
  { href: "/coordinate/messages", label: "Messages" },
  { href: "/coordinate/audit", label: "Activity log", roles: ["support_coordinator", "mapable_admin"] as UserRole[] },
] as const;

export function CoordinateNav({ role }: { role: UserRole }) {
  const links = ALL_LINKS.filter(
    (link) => !("roles" in link) || !link.roles || link.roles.includes(role),
  ).map((link) => ({
    href: link.href,
    label: link.label,
    ...("exact" in link && link.exact ? { exact: true as const } : {}),
  }));

  return (
    <MapAbleRoleNav
      label="MapAble Coordinate navigation"
      title="MapAble Coordinate"
      links={links}
      trailing={
        <Link
          href="/dashboard"
          className="text-sm font-black text-[#005B7F] hover:underline"
        >
          Dashboard
        </Link>
      }
    />
  );
}
