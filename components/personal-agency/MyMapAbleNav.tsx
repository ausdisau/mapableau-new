"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";
import { mapableGoFlags } from "@/lib/config/mapable-go";
import { mapableHomeFlags } from "@/lib/config/mapable-home";

const DESKTOP_LINKS = [
  { href: "/my", label: "Home", exact: true },
  { href: "/my/life", label: "My life", matchPrefix: "/my/life" },
  ...(mapableGoFlags.enabled
    ? [{ href: "/go", label: "Go", matchPrefix: "/go" }]
    : []),
  ...(mapableHomeFlags.enabled && mapableHomeFlags.simulatorEnabled
    ? [{ href: "/my/home", label: "My home", matchPrefix: "/my/home" }]
    : []),
  {
    href: "/dashboard/find-support",
    label: "Supports",
    matchPrefix: "/dashboard/find-support",
  },
  { href: "/dashboard/jobs", label: "Work", matchPrefix: "/dashboard/jobs" },
  { href: "/my/people", label: "My people", matchPrefix: "/my/people" },
  { href: "/my/devices", label: "My devices", matchPrefix: "/my/devices" },
  {
    href: "/dashboard/billing",
    label: "Money",
    matchPrefix: "/dashboard/billing",
  },
  {
    href: "/my/control",
    label: "Privacy & control",
    matchPrefix: "/my/control",
  },
  {
    href: "/dashboard/safety",
    label: "Safety & help",
    matchPrefix: "/dashboard/safety",
  },
] as const;

const MOBILE_LINKS = [
  { href: "/my", label: "Home", exact: true },
  ...(mapableGoFlags.enabled ? [{ href: "/go", label: "Go" }] : []),
  { href: "/my/ask", label: "Ask", matchPrefix: "/my/ask" },
  { href: "/my/life", label: "Life", matchPrefix: "/my/life" },
  { href: "/my/more", label: "More", matchPrefix: "/my/more" },
] as const;

export function MyMapAbleNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="hidden md:block">
        <MapAbleRoleNav
          label="My MapAble"
          title="My MapAble"
          links={DESKTOP_LINKS.map((link) => ({
            href: link.href,
            label: link.label,
            exact: "exact" in link ? link.exact : undefined,
            matchPrefix: "matchPrefix" in link ? link.matchPrefix : link.href,
          }))}
          trailing={
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[#005B7F] hover:underline"
            >
              Control panel
            </Link>
          }
        />
      </div>
      <nav
        aria-label="My MapAble mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_LINKS.map((link) => {
            const active =
              "exact" in link && link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center px-1 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#F8C51C]/40 ${
                    active ? "text-[#005B7F]" : "text-slate-600"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
