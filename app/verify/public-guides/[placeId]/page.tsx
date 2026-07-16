import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getVerifyInventory } from "@/lib/access-intelligence/verify/inventory";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Public access guide | MapAble Verify",
};

export default async function PublicGuidePage({ params }: Props) {
  const { placeId } = await params;
  const inventory = getVerifyInventory(placeId);

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title={inventory ? `${inventory.placeName} — public access guide` : "Public access guide"}
        description="Known features with dates and caveats. Not a legal compliance statement."
      >
        {!inventory ? (
          <p role="alert">Place not found.</p>
        ) : (
          <article className="space-y-6 print:text-black">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              {inventory.fictionalNotice}
            </p>
            <section>
              <h2 className="text-xl font-black">Known features</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {inventory.features.slice(0, 20).map((f) => (
                  <li key={f.id}>
                    {f.featureType.replaceAll("_", " ")}: {String(f.value)}
                    {f.unit ? ` ${f.unit}` : ""} · source {f.sourceType.replaceAll("_", " ")} ·
                    observed {f.observedAt.slice(0, 10)}
                    {f.disputed ? " · disputed" : ""}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-black">Operational caveats</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {inventory.unknownFeatures.map((f) => (
                  <li key={f.id}>
                    Unknown: {f.featureType.replaceAll("_", " ")} — {f.notes ?? "not confirmed"}
                  </li>
                ))}
                {inventory.incidents
                  .filter((i) => i.status === "active")
                  .map((i) => (
                    <li key={i.id}>
                      Active incident: {i.description}
                    </li>
                  ))}
                {!inventory.unknownFeatures.length &&
                !inventory.incidents.some((i) => i.status === "active") ? (
                  <li>No listed operational unknowns on this snapshot.</li>
                ) : null}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-black">Contact / verification</h2>
              <p className="text-sm text-slate-700">
                Request a venue verification through Access Intelligence Visit mode. Venue replies
                remain attestations unless a qualified assessor verifies with scoped evidence.
              </p>
            </section>
            <Link
              href={`/access-intelligence/buildings/${placeId}`}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 font-black print:hidden ${mapableCareFocusRing}`}
            >
              Plan a visit
            </Link>
          </article>
        )}
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
