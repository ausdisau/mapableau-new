import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import {
  isAccessCapsulesEnabled,
  isDecisionRoomEnabled,
  isPersonalVaultEnabled,
  isRightsCentreEnabled,
  isRightsLedgerEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";

export default async function RightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  if (!isRightsOsEnabled() || !isRightsCentreEnabled()) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="font-heading text-2xl font-bold">Rights Centre</h1>
        <p className="mt-2 text-muted-foreground">
          RightsOS is not enabled in this environment.
        </p>
      </div>
    );
  }

  const nav = [
    { href: "/rights", label: "Overview" },
    { href: "/rights/active-access", label: "Active access" },
    { href: "/rights/history", label: "History" },
    ...(isRightsLedgerEnabled()
      ? [{ href: "/rights/ledger", label: "Rights ledger" }]
      : []),
    ...(isPersonalVaultEnabled()
      ? [{ href: "/rights/vault", label: "Vault" }]
      : []),
    ...(isDecisionRoomEnabled()
      ? [{ href: "/rights/decisions", label: "Decisions" }]
      : []),
    ...(isAccessCapsulesEnabled()
      ? [{ href: "/rights/capsules", label: "Capsules" }]
      : []),
    { href: "/rights/requests", label: "Requests" },
    { href: "/rights/privacy-help", label: "Privacy help" },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Rights Centre</h1>
        <p className="mt-2 text-muted-foreground">
          See who uses your information, for what purpose, and for how long. You can
          approve, refuse, or revoke at any time.
        </p>
        <nav aria-label="Rights Centre" className="mt-4 flex flex-wrap gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
