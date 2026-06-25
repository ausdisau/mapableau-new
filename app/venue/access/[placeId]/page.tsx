import Link from "next/link";

import { AccessAlertList } from "@/components/access/AccessAlertList";
import { SkipToContent } from "@/components/core/SkipToContent";
import { listActiveAlerts } from "@/lib/access-alerts/access-alert-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { isVenueOwner } from "@/lib/access-community/access-role-policy";
import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export default async function VenueAccessDashboardPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const user = await requireAuth();
  const { placeId } = await params;

  const isOwner = await isVenueOwner(user.id, placeId);
  if (!isOwner) redirect(`/access/places/${placeId}`);

  const [place, alerts] = await Promise.all([
    getPlaceById(placeId, true),
    listActiveAlerts({ placeId }),
  ]);

  if (!place) {
    return <p>Place not found.</p>;
  }

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold">Venue dashboard — {place.name}</h1>
        <p className="text-sm text-muted-foreground">
          Manage your claimed listing and respond to access alerts.
        </p>

        <section aria-labelledby="venue-alerts-heading">
          <h2 id="venue-alerts-heading" className="text-lg font-semibold">
            Unresolved access alerts
          </h2>
          <AccessAlertList
            placeId={placeId}
            alerts={alerts.map((a) => ({
              id: a.id,
              alertType: a.alertType,
              title: a.title,
              description: a.description,
              status: a.status,
              expiresAt: a.expiresAt?.toISOString() ?? null,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </section>

        <Link
          href={`/access/places/${placeId}`}
          className="inline-block underline text-sm"
        >
          View public listing
        </Link>
      </main>
    </>
  );
}
