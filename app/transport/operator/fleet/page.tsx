import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata = {
  title: "Fleet workspace | MapAble Transport",
};

/**
 * Fleet and eligibility workspace shell.
 * Full CRUD lands in Stage F; this page is honest about pilot status.
 */
export default async function TransportOperatorFleetPage() {
  const user = await requireAuth();
  const canOperate =
    hasPermission(user.primaryRole, "transport:manage:org") ||
    hasPermission(user.primaryRole, "transport:read:org") ||
    hasPermission(user.primaryRole, "transport:manage:any");

  if (!canOperate) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">Fleet workspace</h1>
        <p className="text-sm text-muted-foreground" role="status">
          You do not have transport operator access for fleet management.
        </p>
        <Link
          href="/transport"
          className="inline-flex min-h-12 items-center text-primary underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to Transport
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Fleet and eligibility</h1>
        <p className="text-sm text-muted-foreground">
          Manage drivers, vehicles, and credential expiries. Assignment remains
          fail-closed until eligibility checks pass.
        </p>
      </header>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        <li>
          <Link
            href="/provider/transport/dispatch"
            className="text-primary underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open dispatch workspace
          </Link>
        </li>
        <li>
          <Link
            href="/provider/drivers"
            className="text-primary underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Drivers
          </Link>
        </li>
        <li>
          <Link
            href="/provider/vehicles"
            className="text-primary underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Vehicles
          </Link>
        </li>
      </ul>
      <p className="text-sm text-muted-foreground" role="status">
        Expanded fleet controls (prestart board, service zones, expiry
        dashboards) are in progress and not yet a production claim.
      </p>
    </div>
  );
}
