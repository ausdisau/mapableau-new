import Link from "next/link";

import { AccessAlertList } from "@/components/access/AccessAlertList";
import { SkipToContent } from "@/components/core/SkipToContent";
import { listActiveAlerts } from "@/lib/access-alerts/access-alert-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";

export default async function PlaceAlertsPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Place not found.</p>
      </div>
    );
  }

  const alerts = await listActiveAlerts({ placeId });

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <nav className="text-sm">
          <Link href={`/access/places/${placeId}`} className="underline">
            Back to {place.name}
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">Access alerts — {place.name}</h1>
        <AccessAlertList
          alerts={alerts.map((a) => ({
            id: a.id,
            alertType: a.alertType,
            title: a.title,
            description: a.description,
            status: a.status,
            expiresAt: a.expiresAt?.toISOString() ?? null,
            createdAt: a.createdAt.toISOString(),
          }))}
          placeId={placeId}
        />
      </main>
    </>
  );
}
