import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AccessDataSourceMarker,
  resolveAccessDataSourceKind,
} from "@/components/access/AccessDataSourceMarker";
import { AccessFitDetailSection } from "@/components/accessibility-map/AccessFitDetailSection";
import { ViewFloorPlanButton } from "@/components/accessibility-map/floor-plan/ViewFloorPlanButton";
import { VenueAccessDetails } from "@/components/accessibility-map/VenueAccessDetails";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccessMapPlaceBySlug } from "@/lib/access/map/access-map-places";
import { ACCESS_DISCLAIMER } from "@/lib/access/map/copy";
import { buildPlaceAccessibilityJsonLd } from "@/lib/access/place-json-ld";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getAccessMapPlaceBySlug(slug);
  if (!place) {
    return { title: "Place not found | MapAble" };
  }
  if (place.isDemo) {
    return {
      title: `${place.name} | Illustrative access profile`,
      description: "A fictional example of access information. Not a verified place, rating or travel recommendation.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${place.name} access details`,
    description: `Access score ${place.accessScore}, ${place.tier} tier, last checked ${place.lastChecked}. Evidence-based access information for ${place.suburb}.`,
  };
}

export default async function AccessibilityMapPlacePage({ params }: PageProps) {
  const { slug } = await params;
  const place = await getAccessMapPlaceBySlug(slug);
  if (!place) notFound();

  const unknownDomains = place.domains.filter((domain) => domain.status !== "known");
  const sourceKind = resolveAccessDataSourceKind({
    isDemo: place.isDemo,
    source: place.source,
    tier: place.tier,
  });
  const placeUrl = `${getCanonicalPublicOrigin()}/accessibility-map/${place.slug}`;
  const rampMeasurement = place.measurements.find((m) =>
    /gradient|slope|ramp/i.test(m.label),
  );
  const jsonLd = place.isDemo ? null : buildPlaceAccessibilityJsonLd({
    name: place.name,
    description: `Access score ${place.accessScore}. ${place.topAccessFacts.join(". ")}`,
    url: placeUrl,
    suburb: place.suburb,
    state: place.state,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category,
    doorWidthMm: place.profile.doorWidthMm,
    stepFreeEntry: place.profile.stepFreeEntry,
    accessibleToilet: place.profile.accessibleToilet,
    accessibleParking: place.profile.accessibleParking,
    hearingLoop: place.profile.hearingLoop,
    rampSlopeRatio: rampMeasurement?.value ?? null,
    lastChecked: place.lastChecked,
  });

  return (
    <MapAbleCareMarketingShell>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <article className="mx-auto max-w-4xl space-y-8 px-5 py-10 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
          {place.isDemo ? "Illustrative profile — not assessed" : "Place access details"}
        </p>
        <header className="space-y-3">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-[#0C1833]">
            {place.name}
          </h1>
          <p className="capitalize text-slate-600">
            {place.category.replace(/_/g, " ")} · {place.suburb}, {place.state}
          </p>
          <AccessDataSourceMarker kind={sourceKind} />
          <ul className="flex flex-wrap gap-2 text-sm">
            {place.isDemo ? (
              <li className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-950">
                Access status: Unknown — illustrative values only
              </li>
            ) : (
              <li className="rounded-full bg-[#F6FBFC] px-3 py-1 font-semibold">
                Access score {place.accessScore}
              </li>
            )}
            {!place.isDemo ? (
              <li className="rounded-full bg-[#F6FBFC] px-3 py-1 font-semibold">
                Tier: {place.tier}
              </li>
            ) : null}
            {!place.isDemo ? (
              <li className="rounded-full bg-[#F6FBFC] px-3 py-1 font-semibold">
                Confidence: {place.confidence}
              </li>
            ) : null}
            {!place.isDemo ? (
              <li className="rounded-full bg-[#F6FBFC] px-3 py-1 font-semibold">
                Last checked {place.lastChecked}
              </li>
            ) : null}
            <li className="rounded-full bg-[#F6FBFC] px-3 py-1 font-semibold">
              Source: {place.isDemo ? "Fictional example" : place.source}
            </li>
          </ul>
        </header>

        <VenueAccessDetails place={place} sourceKind={sourceKind} />

        <AccessFitDetailSection
          place={place}
          unknownDomainQuestions={unknownDomains.map(
            (domain) => `Confirm: ${domain.name}`,
          )}
        />

        <section
          aria-labelledby="floor-plan-heading"
          className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5"
        >
          <h2 id="floor-plan-heading" className="text-xl font-black">
            Indoor floor plan
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Explore indoor layout information where available. Example layouts and measurements
            are not verified access conditions and must not be used for route assurance.
          </p>
          <div className="mt-4">
            {place.hasFloorPlan ? (
              <ViewFloorPlanButton
                venueId={place.id}
                venueName={place.name}
                venueSlug={place.slug}
                variant="primary"
              />
            ) : (
              <p className="text-sm text-slate-600">Floor plan not currently available.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" className="text-xl font-black">
            Evidence
          </h2>
          <div className="mt-4 space-y-3">
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">{place.isDemo ? "Illustrative measurements — not verified" : "Measurements"}</summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {place.measurements.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value}
                    {item.note ? ` (${item.note})` : ""}
                  </li>
                ))}
              </ul>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">Photos</summary>
              <p className="mt-3 text-sm text-slate-600">
                No photo evidence is attached to this illustrative profile. Do not infer accessibility from missing images.
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">Reviews</summary>
              <p className="mt-3 text-sm text-slate-600">
                This example explains possible source categories; it is not a record of actual community or assessor reviews.
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">Assessor notes</summary>
              <p className="mt-3 text-sm text-slate-600">
                Source: {place.source}. Last checked {place.lastChecked}. Confidence{" "}
                {place.confidence}.
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">
                Provider-declared info
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                {place.source === "provider"
                  ? "Provider-declared access details included in this profile."
                  : "No independently checked provider statement is attached to this example."}
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">Community updates</summary>
              <p className="mt-3 text-sm text-slate-600">
                <Link href="/add-access-info" className="font-semibold text-[#005B7F] underline">
                  Submit a community update
                </Link>
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold">Issues reported</summary>
              <p className="mt-3 text-sm text-slate-600">
                {place.keyBarrier
                  ? `Open issue focus: ${place.keyBarrier}`
                  : "No real-world barrier status has been established for this example."}
              </p>
            </details>
          </div>
        </section>

        <section aria-labelledby="domains-heading">
          <h2 id="domains-heading" className="text-xl font-black">
            Accessibility domains
          </h2>
          <ul className="mt-4 space-y-3">
            {place.domains.map((domain) => (
              <li key={domain.name} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{domain.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {domain.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{domain.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="actions-heading"
          className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5"
        >
          <h2 id="actions-heading" className="text-xl font-black">
            Action panel
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionLink href="/journey-planner" label="Plan accessible trip" />
            <ActionLink href="/transport" label="Learn about Transport" />
            <ActionLink href="/care" label="Learn about Care" />
            <ActionLink href={`/accessibility-map/${place.slug}`} label="Share access info" />
            <ActionLink href="/add-access-info" label="Report outdated info" />
            <ActionLink href="/verify-my-venue" label="Claim/manage this venue" />
          </div>
        </section>

        <p className="text-sm text-slate-600" role="note">
          MapAble verification provides access information, not legal certification.{" "}
          {ACCESS_DISCLAIMER}
        </p>

        <p>
          <Link
            href="/accessibility-map"
            className={`font-semibold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}
          >
            Back to Accessibility Map
          </Link>
        </p>
      </article>
    </MapAbleCareMarketingShell>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
    >
      {label}
    </Link>
  );
}
