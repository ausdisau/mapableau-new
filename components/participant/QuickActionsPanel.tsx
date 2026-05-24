import React from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  MessageCircle,
  Search,
  Heart,
  Bus,
} from "lucide-react";

const ACTIONS = [
  {
    href: "/provider-finder",
    label: "Find a provider",
    description: "Search care, transport and therapy",
    icon: Search,
  },
  {
    href: "/dashboard/bookings/new",
    label: "Request care",
    description: "Start a new support request",
    icon: Heart,
  },
  {
    href: "/dashboard/find-transport",
    label: "Book transport",
    description: "Accessible transport options",
    icon: Bus,
  },
  {
    href: "/dashboard/invoices",
    label: "View invoices",
    description: "Payments and approvals",
    icon: FileText,
  },
  {
    href: "/dashboard/messages",
    label: "Message support",
    description: "Secure booking-linked chats",
    icon: MessageCircle,
  },
  {
    href: "/dashboard/calendar",
    label: "Your calendar",
    description: "See upcoming dates",
    icon: Calendar,
  },
] as const;

export function QuickActionsPanel() {
  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-3">
      <h2
        id="quick-actions-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Quick actions
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ACTIONS.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="flex min-h-14 items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <action.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
