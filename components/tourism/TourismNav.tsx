"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const links = [
  { href: "/tourism", label: "Discover" },
  { href: "/tourism/plan", label: "Plan a trip" },
  { href: "/tourism/trips/sydney-demo", label: "My itinerary" },
  { href: "/tourism/map", label: "Explore map" },
];

export function TourismNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Tourism"
      className="border-b border-slate-200 bg-white px-5 py-3 lg:px-8"
    >
      <ul className="mx-auto flex max-w-7xl flex-wrap gap-2">
        {links.map((link) => {
          const current =
            link.href === "/tourism"
              ? pathname === "/tourism"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${mapableCareFocusRing} ${
                  current
                    ? "bg-[#005B7F] text-white"
                    : "text-[#005B7F] hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
