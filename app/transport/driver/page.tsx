import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Driver field workspace entry.
 * Drivers with transport:drive go to the existing driver trips UI.
 */
export default async function TransportDriverPage() {
  const user = await requireAuth();
  const canDrive =
    hasPermission(user.primaryRole, "transport:drive") ||
    hasPermission(user.primaryRole, "transport:manage:org") ||
    hasPermission(user.primaryRole, "transport:manage:any");

  if (canDrive) {
    redirect("/driver/trips");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-12">
      <h1 className="font-heading text-2xl font-bold">Driver workspace</h1>
      <p className="text-sm text-muted-foreground" role="status">
        This mobile field view is for assigned transport drivers. If you are a
        participant, request a trip from your transport dashboard.
      </p>
      <Link
        href="/transport/dashboard"
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go to transport dashboard
      </Link>
    </div>
  );
}
