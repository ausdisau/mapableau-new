import Link from "next/link";
import { Bell } from "lucide-react";

export function InAppNotificationBell({
  unreadCount = 0,
  href = "/dashboard/notifications",
}: {
  unreadCount?: number;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
