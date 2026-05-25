import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function UnreadMessagesCard({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
        <span>
          <span className="font-semibold">Messages</span>
          <span className="block text-sm text-muted-foreground">
            {count === 0
              ? "No unread messages"
              : `${count} unread message${count === 1 ? "" : "s"}`}
          </span>
        </span>
      </span>
      {count > 0 ? (
        <span
          className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground"
          aria-label={`${count} unread`}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
