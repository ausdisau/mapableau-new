import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getVerifyInventory } from "@/lib/access-intelligence/verify/inventory";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Incidents | MapAble Verify",
};

export default async function VerifyIncidentsPage({ params }: Props) {
  const { placeId } = await params;
  const inventory = getVerifyInventory(placeId);

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Live incidents"
        description="Active and historical access incidents. Operate console supports create/update with audit."
      >
        {!inventory ? (
          <p role="alert">Venue not found.</p>
        ) : (
          <div className="space-y-6">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              {inventory.fictionalNotice}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/access-intelligence/operate/${placeId}?role=demo_preview`}
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
              >
                Manage in Operate
              </Link>
              <Link
                href={`/verify/venues/${placeId}`}
                className={`inline-flex min-h-11 items-center rounded-xl border px-4 font-black ${mapableCareFocusRing}`}
              >
                Back to inventory
              </Link>
            </div>
            {inventory.temporaryRoute ? (
              <p className="text-sm text-slate-700">
                Temporary western-lift route published: {inventory.temporaryRoute.text}
              </p>
            ) : null}
            <ul className="space-y-3">
              {inventory.incidents.map((i) => (
                <li key={i.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                  <p className="font-bold">
                    {i.type.replaceAll("_", " ")} · {i.status}
                  </p>
                  <p className="mt-1">{i.description}</p>
                </li>
              ))}
              {!inventory.incidents.length ? (
                <li>No incidents on this twin snapshot.</li>
              ) : null}
            </ul>
          </div>
        )}
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
