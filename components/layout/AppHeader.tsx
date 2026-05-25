"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { RoleBadge } from "@/components/ui/role-badge";
import { homePathForRole } from "@/lib/navigation/role-navigation";
import { useCurrentRole } from "@/lib/hooks/useCurrentRole";
import { useSession } from "next-auth/react";

export function AppHeader({ compact = false }: { compact?: boolean }) {
  const { data } = useSession();
  const role = useCurrentRole();
  const home = homePathForRole(role);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:py-3">
        <div className="min-w-0">
          <Link
            href={home}
            className="font-heading text-base font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-lg"
          >
            MapAble
          </Link>
          {!compact && data?.user?.name ? (
            <p className="truncate text-xs text-muted-foreground">
              {data.user.name}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {role ? <RoleBadge role={role} /> : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="min-h-11 min-w-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sign out"
          >
            Out
          </button>
        </div>
      </div>
    </header>
  );
}
