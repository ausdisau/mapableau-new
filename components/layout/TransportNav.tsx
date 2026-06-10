"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/transport", label: "Overview", exact: true },
  { href: "/dashboard/transport/new", label: "New trip" },
  { href: "/dashboard/transport", label: "My trips", matchPrefix: "/dashboard/transport" },
  { href: "/dashboard/find-transport", label: "Find operators" },
  { href: "/dashboard/transport/legacy", label: "Legacy bookings" },
  { href: "/driver/trips", label: "Driver view", matchPrefix: "/driver" },
];

export function TransportNav() {
  return (
    <MapAbleRoleNav
      label="Transport navigation"
      title="MapAble Transport"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
