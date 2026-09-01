"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mapableGoFlags } from "@/lib/config/mapable-go";
import { mapableHomeFlags } from "@/lib/config/mapable-home";
import { sidebarNavLinkClass, type SidebarNavItem } from "@mapable/ui";

export const UNIFIED_SIDEBAR_LINKS: SidebarNavItem[] = [
  { href: "/my", label: "Home" },
  { href: "/my/life", label: "My life" },
  ...(mapableGoFlags.enabled ? [{ href: "/go", label: "Go" }] : []),
  ...(mapableHomeFlags.enabled && mapableHomeFlags.simulatorEnabled
    ? [{ href: "/my/home", label: "My home" }]
    : []),
  { href: "/care", label: "Care" },
  { href: "/dashboard/transport", label: "Transport" },
  { href: "/dashboard/accessibility", label: "Accessibility" },
  { href: "/dashboard/find-support", label: "Find support" },
  { href: "/dashboard/jobs", label: "Work & study" },
  { href: "/my/people", label: "My people" },
  { href: "/my/devices", label: "My devices" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/my/control", label: "Privacy & control" },
  { href: "/dashboard/safety", label: "Safety & help" },
];

export const UNIFIED_MOBILE_LINKS = [
  { href: "/my", label: "Home", exact: true },
  ...(mapableGoFlags.enabled ? [{ href: "/go", label: "Go" }] : []),
  { href: "/my/ask", label: "Ask", matchPrefix: "/my/ask" },
  { href: "/my/life", label: "Life", matchPrefix: "/my/life" },
  { href: "/my/more", label: "More", matchPrefix: "/my/more" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UnifiedParticipantSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="My MapAble">
      <ul className="space-y-1">
        {UNIFIED_SIDEBAR_LINKS.map((item) => {
          const active = isActive(
            pathname,
            item.href,
            item.href === "/my",
          );
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={sidebarNavLinkClass(active)}
                data-testid={`unified-nav-${item.href.replace(/\//g, "-")}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="mt-4 border-t border-slate-200 pt-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#005B7F] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          >
            Legacy control panel
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export function UnifiedParticipantMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="My MapAble mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden"
      data-testid="unified-mobile-nav"
    >
      <ul className="grid grid-cols-5">
        {UNIFIED_MOBILE_LINKS.map((link) => {
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
  );
}
