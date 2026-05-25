"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationForRole } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/types/mapable";

interface RoleAwareNavigationProps {
  role: UserRole;
  variant: "mobile" | "desktop";
}

export function RoleAwareNavigation({
  role,
  variant,
}: RoleAwareNavigationProps) {
  const pathname = usePathname();
  const items = navigationForRole(role);

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white safe-area-pb md:hidden"
      >
        <ul className="flex justify-around items-stretch">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center min-h-[3.25rem] px-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                    active ? "text-blue-800" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block min-h-11 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? "bg-blue-50 text-blue-900"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
