"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { desktopNavForRole } from "@/lib/navigation/role-navigation";
import { useCurrentRole } from "@/lib/hooks/useCurrentRole";

export function DesktopSidebar() {
  const pathname = usePathname();
  const role = useCurrentRole();
  const items = desktopNavForRole(role);

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-border bg-card md:block lg:w-64"
      aria-label="Sidebar"
    >
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
