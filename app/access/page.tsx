import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { SkipToContent } from "@/components/core/SkipToContent";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import { listPublishedPlaces } from "@/lib/access-map/access-place-service";
import {
  formatDomainScoresForApi,
  getPlaceDomainSummaries,
} from "@/lib/access-reports/access-domain-service";
import { countActiveAlertsForPlace } from "@/lib/access-alerts/access-alert-service";

export const metadata = {
  title: "MapAble Access | Community accessibility map",
  description:
    "Browse community-reported accessibility information for places across Australia.",
};

export default async function AccessPage() {
  const places = await listPublishedPlaces(50);

  const initialPlaces = await Promise.all(
    places.map(async (p) => {
      const scores = await getPlaceDomainSummaries(p.id);
      const summary = formatDomainScoresForApi(scores);
      const activeAlertCount = await countActiveAlertsForPlace(p.id);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        suburb: p.suburb,
        reviewCount: p._count.reviews,
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
        overallScore: summary.overallScore,
        activeAlertCount,
      };
    })
  );

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="min-h-screen">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <h1 className="text-2xl font-bold">MapAble Access</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {ACCESS_DISCLAIMER}
          </p>
        </div>
        <MapAbleAccessShell initialPlaces={initialPlaces} />
      </main>
    </>
  );
}
