import Link from "next/link";

import { DemoDataBanner } from "@/components/digital-twin/DemoDataBanner";
import { DigitalTwinDisclaimerPanel } from "@/components/digital-twin/DigitalTwinDisclaimerPanel";
import {
  DEMO_ASSESSMENTS,
  DEMO_EVIDENCE,
  DEMO_FEATURES,
  DEMO_ISSUES,
  DEMO_PLACES,
} from "@/lib/digital-twin/sample-data";
import { buildIntelligenceReport } from "@/lib/digital-twin/intelligence";

export const metadata = {
  title: "Digital Twin Intelligence | MapAble",
  description: "Privacy-safe aggregate accessibility insights from demo Digital Twin data.",
};

export default function DigitalTwinIntelligencePage() {
  const report = buildIntelligenceReport({
    places: DEMO_PLACES,
    features: DEMO_FEATURES,
    evidence: DEMO_EVIDENCE,
    issues: DEMO_ISSUES,
    assessments: DEMO_ASSESSMENTS,
  });

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <DemoDataBanner />

      <header className="mt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[#005B7F]">
          MapAble Digital Twin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Intelligence summary (demo)</h1>
        <p className="mt-4 text-muted-foreground">{report.ethicsNotice}</p>
      </header>

      <section aria-labelledby="metrics-heading" className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h2 id="metrics-heading" className="text-sm font-semibold">
            Accessible toilet information
          </h2>
          <p className="mt-2 text-2xl font-bold">{report.accessibleToiletInfoPercent}%</p>
          <p className="text-sm text-muted-foreground">of demo places with confirmed toilet info</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">Places needing updated assessment</h2>
          <p className="mt-2 text-2xl font-bold">{report.placesNeedingUpdatedAssessment}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">Transport connection gaps</h2>
          <p className="mt-2 text-2xl font-bold">{report.transportConnectionGaps}</p>
        </div>
      </section>

      <section aria-labelledby="barriers-heading" className="mt-10">
        <h2 id="barriers-heading" className="text-xl font-semibold">
          Most common barrier types
        </h2>
        <ul className="mt-4 space-y-2">
          {report.commonBarriers.map((b) => (
            <li key={b.barrierType} className="flex justify-between rounded-lg border border-border p-3 text-sm">
              <span className="capitalize">{b.barrierType.replace(/_/g, " ")}</span>
              <span className="font-semibold">{b.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="regions-heading" className="mt-10">
        <h2 id="regions-heading" className="text-xl font-semibold">
          Regions with lower average confidence
        </h2>
        {report.regionsWithLowConfidence.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No regions below threshold in demo dataset (minimum aggregation applies in production).
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {report.regionsWithLowConfidence.map((r) => (
              <li key={r.region} className="rounded-lg border border-border p-3 text-sm">
                {r.region}: confidence {Math.round(r.averageConfidence)}%, score{" "}
                {Math.round(r.averageAccessibilityScore)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="improve-heading" className="mt-10">
        <h2 id="improve-heading" className="text-xl font-semibold">
          Top improvement opportunities
        </h2>
        <ul className="mt-4 list-inside list-disc text-sm">
          {report.topImprovementOpportunities.map((o) => (
            <li key={o} className="capitalize">
              {o.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <DigitalTwinDisclaimerPanel />
      </div>

      <p className="mt-6 text-sm">
        <Link href="/digital-twin" className="font-semibold text-[#005B7F] hover:underline">
          ← Back to Digital Twin explorer
        </Link>
      </p>
    </main>
  );
}
