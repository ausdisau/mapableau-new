import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Operator dispatch workspace entry.
 * Authorised provider staff are sent to the existing dispatch console.
 */
export default async function TransportOperatorPage() {
  const user = await requireAuth();
  const canOperate =
    hasPermission(user.primaryRole, "transport:manage:org") ||
    hasPermission(user.primaryRole, "transport:read:org") ||
    hasPermission(user.primaryRole, "transport:manage:any");

  if (canOperate) {
    redirect("/provider/transport/dispatch");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-12">
      <h1 className="font-heading text-2xl font-bold">Operator workspace</h1>
      <p className="text-sm text-muted-foreground" role="status">
        This area is for authorised transport operator staff. If you need
        transport as a participant, use the request flow instead.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/transport/request"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Request transport
        </Link>
        <Link
          href="/for-providers"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border px-4 font-medium focus-visible:ring-2 focus-visible:ring-ring"
        >
          Register as a provider
        </Link>
      </div>
    </div>
  );
}
