"use client";

import Link from "next/link";

import type { ConversationThread } from "@/types/messages";

const THREAD_LABELS: Record<string, string> = {
  direct: "Direct message",
  group: "Group chat",
  booking: "Booking",
  transport_trip: "Transport",
  invoice: "Invoice",
  service_agreement: "Agreement",
  support_ticket: "Support",
  complaint: "Complaint",
  incident_safe_comms: "Safety",
  telehealth: "Telehealth",
  provider_team: "Team",
  admin_support: "Admin support",
};

function ThreadItemContent({
  thread,
  isActive,
}: {
  thread: ConversationThread;
  isActive?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{thread.title}</span>
        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs">
          {THREAD_LABELS[thread.threadType] ?? thread.threadType}
        </span>
      </div>
      {thread.lastMessagePreview ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {thread.lastMessagePreview}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Updated {new Date(thread.updatedAt).toLocaleString("en-AU")}
      </p>
    </>
  );
}

const itemClass = (isActive?: boolean) =>
  `block min-h-14 w-full rounded-lg border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive
      ? "border-primary bg-primary/5"
      : "border-border bg-card hover:border-primary/40"
  }`;

export function InboxThreadItem({
  thread,
  href,
  isActive,
  asStatic,
}: {
  thread: ConversationThread;
  href: string;
  isActive?: boolean;
  /** Render card only (no link/list item) for use inside overlay buttons */
  asStatic?: boolean;
}) {
  if (asStatic) {
    return (
      <div className={itemClass(isActive)}>
        <ThreadItemContent thread={thread} isActive={isActive} />
      </div>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className={itemClass(isActive)}
        aria-current={isActive ? "page" : undefined}
      >
        <ThreadItemContent thread={thread} isActive={isActive} />
      </Link>
    </li>
  );
}
