export type CoreCapability = {
  id: string;
  title: string;
  description: string;
  href: string;
};

/** Unified hub capabilities from the Master Business Plan — live routes only. */
export const CORE_CAPABILITIES: CoreCapability[] = [
  {
    id: "account",
    title: "Account",
    description: "One secure identity across MapAble — profile, roles and sign-in.",
    href: "/dashboard",
  },
  {
    id: "billing",
    title: "Billing",
    description:
      "Subscriptions and payments in one place. Plan-managed and Stripe flows stay separate — nothing auto-submits NDIS claims.",
    href: "/dashboard/billing",
  },
  {
    id: "messaging",
    title: "Messaging",
    description: "Unified inbox and notifications for conversations with providers and support.",
    href: "/dashboard/messages",
  },
  {
    id: "support",
    title: "Support",
    description: "Help tickets, safety centre and escalation when you need a human.",
    href: "/dashboard/safety/support",
  },
];

export const CORE_CAPABILITIES_SECTION = {
  title: "MapAble Core",
  description:
    "Your backbone hub: account, billing, messaging and support in one interface across services.",
} as const;
