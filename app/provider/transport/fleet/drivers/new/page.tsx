import Link from "next/link";

import { FleetDriverEditor } from "@/components/transport/FleetDriverEditor";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";

export default async function NewFleetDriverPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation to add fleet drivers.</p>;
  }

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/provider/transport/fleet/drivers"
          className="text-sm text-primary hover:underline"
        >
          ← Drivers
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Add fleet driver</h1>
      <FleetDriverEditor organisationId={organisationId} mode="create" />
    </div>
  );
}
