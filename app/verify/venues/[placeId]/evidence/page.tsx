import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getVerifyInventory } from "@/lib/access-intelligence/verify/inventory";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Evidence | MapAble Verify",
};

export default async function VerifyEvidencePage({ params }: Props) {
  const { placeId } = await params;
  const inventory = getVerifyInventory(placeId);

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Evidence ledger"
        description="Provenance-first evidence for this venue. AI inference is never shown as a verified measurement."
      >
        {!inventory ? (
          <p role="alert">Venue not found.</p>
        ) : (
          <div className="space-y-6">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              {inventory.fictionalNotice}
            </p>
            <Link
              href={`/verify/venues/${placeId}`}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 font-black ${mapableCareFocusRing}`}
            >
              Back to inventory
            </Link>
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Evidence assets</caption>
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-1">
                    Title
                  </th>
                  <th scope="col" className="px-2 py-1">
                    Source
                  </th>
                  <th scope="col" className="px-2 py-1">
                    Captured
                  </th>
                  <th scope="col" className="px-2 py-1">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.evidence.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-2 py-1">{e.title}</td>
                    <td className="px-2 py-1">{e.sourceType.replaceAll("_", " ")}</td>
                    <td className="px-2 py-1">
                      <time dateTime={e.capturedAt}>{e.capturedAt.slice(0, 10)}</time>
                    </td>
                    <td className="px-2 py-1">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <section>
              <h2 className="text-lg font-black">Stale or expired</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {inventory.staleEvidence.map((e) => (
                  <li key={e.id}>
                    {e.title} · <time dateTime={e.capturedAt}>{e.capturedAt.slice(0, 10)}</time>
                  </li>
                ))}
                {!inventory.staleEvidence.length ? <li>No stale evidence on this snapshot.</li> : null}
              </ul>
            </section>
          </div>
        )}
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
