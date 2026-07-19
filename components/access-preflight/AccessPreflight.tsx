"use client";

import Link from "next/link";

import { AccessFactStatus } from "@/components/access-preflight/AccessFactStatus";
import { VerificationMetadata } from "@/components/access-preflight/VerificationMetadata";
import { buildAccessPreflight } from "@/lib/access-preflight/build-preflight";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AccessPreflight({ place }: { place: DemoAccessPlace }) {
  const result = buildAccessPreflight(place);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="access-preflight-heading"
      data-testid="access-preflight"
    >
      <h2 id="access-preflight-heading" className="text-xl font-black text-[#0C1833]">
        Access Preflight
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        What could prevent this visit from working for you? Missing information
        stays <strong>Unknown</strong> — it is never treated as “no barriers”.
      </p>

      {result.unresolvedCritical.length > 0 ? (
        <div
          className="mt-4 rounded-xl border-2 border-amber-700 bg-amber-50 p-4"
          role="status"
        >
          <p className="font-black text-amber-950">
            Critical items still need confirmation
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-950">
            {result.unresolvedCritical.map((fact) => (
              <li key={fact.id}>
                {fact.label} — {fact.state}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="mt-5 space-y-4">
        {result.facts.map((fact) => (
          <li
            key={fact.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-[#0C1833]">{fact.label}</h3>
              <AccessFactStatus state={fact.state} />
            </div>
            <VerificationMetadata
              source={fact.source}
              verificationStatus={fact.verificationStatus}
              lastCheckedAt={fact.lastCheckedAt}
              notes={fact.notes}
              confidence={fact.confidence}
            />
          </li>
        ))}
      </ol>

      <div className="mt-5 space-y-2">
        <h3 className="text-sm font-black text-[#0C1833]">Next actions</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {result.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
        <Link
          href={`/report-barrier?placeSlug=${encodeURIComponent(place.slug)}&placeName=${encodeURIComponent(place.name)}`}
          className={`inline-flex min-h-11 items-center font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
        >
          Report an access barrier
        </Link>
      </div>
    </section>
  );
}
