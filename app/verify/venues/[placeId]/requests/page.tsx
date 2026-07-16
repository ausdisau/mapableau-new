import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Verification requests | MapAble Verify",
};

export default async function VerifyRequestsPage({ params }: Props) {
  const { placeId } = await params;

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Verification requests"
        description="Participant verification requests require Trust Kernel approval before any passport fields are shared. Venue replies are attestations unless an assessor verifies."
      >
        <div className="space-y-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            Demonstration notice: request inbox is wired through Visit mode approval cards and
            Operate. This page lists the workflow — it does not invent pending customer requests.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Participant creates a Visit Plan and requests venue verification.</li>
            <li>Trust Kernel shows recipient, purpose, fields, and approval controls.</li>
            <li>On approval, an audit event is recorded; revoked consent blocks execution.</li>
            <li>Venue staff may respond with a labelled venue attestation.</li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/verify/venues/${placeId}`}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 font-black ${mapableCareFocusRing}`}
            >
              Venue inventory
            </Link>
            <Link
              href="/access-intelligence/buildings/place-harbour-civic"
              className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            >
              Open Visit mode
            </Link>
          </div>
        </div>
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
