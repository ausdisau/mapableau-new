"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  href?: string;
  initialUnread?: number;
};

export function NotificationBell({
  href = "/dashboard/notifications",
  initialUnread = 0,
}: Props) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true");
        if (!res.ok) return;
        const data = (await res.json()) as {
          notifications?: unknown[];
        };
        if (!cancelled) {
          setUnread(data.notifications?.length ?? 0);
        }
      } catch {
        /* ignore */
      }
    }
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const label =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? "" : "s"}`
      : "Notifications";

  return (
    <Link
      href={href}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={label}
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground"
          aria-hidden="true"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
