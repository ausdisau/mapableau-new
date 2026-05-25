"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { mobileNavForRole } from "@/lib/navigation/role-navigation";
import { useCurrentRole } from "@/lib/hooks/useCurrentRole";

function isActive(pathname: string, href: string): boolean {
  if (href === "/participant" || href === "/provider" || href === "/worker" || href === "/driver" || href === "/plan-manager" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const role = useCurrentRole();
  const items = mobileNavForRole(role);

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.ariaLabel ?? item.label}
                className={cn(
                  "flex min-h-[3.25rem] min-w-[2.75rem] flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
