"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CompatibilityChecker } from "@/components/digital-twin/CompatibilityChecker";
import { DemoDataBanner } from "@/components/digital-twin/DemoDataBanner";
import { DigitalTwinDisclaimerPanel } from "@/components/digital-twin/DigitalTwinDisclaimerPanel";
import { EvidenceSubmissionForm } from "@/components/digital-twin/EvidenceSubmissionForm";
import { IssueReportForm } from "@/components/digital-twin/IssueReportForm";
import { ScoreLabel, TierBadge } from "@/components/digital-twin/TierBadge";
import { getCriticalBarriers } from "@/lib/digital-twin/scoring";
import type { TwinPlaceBundle, TwinZoneType } from "@/lib/digital-twin/types";

const ZONE_ORDER: TwinZoneType[] = [
  "external_path",
  "parking",
  "dropoff",
  "entrance",
  "reception",
  "corridor",
  "room",
  "toilet",
  "sensory_space",
  "lift",
  "platform",
  "stop",
  "other",
];

export function DigitalTwinPlaceDetail({ bundle }: { bundle: TwinPlaceBundle }) {
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const sortedZones = useMemo(
    () =>
      [...bundle.zones].sort(
        (a, b) =>
          ZONE_ORDER.indexOf(a.zoneType) - ZONE_ORDER.indexOf(b.zoneType) || a.order - b.order
      ),
    [bundle.zones]
  );

  const barriers = getCriticalBarriers(bundle.features);
  const strengths = bundle.features.filter(
    (f) => f.availability === "available" && (f.accessibilityLevel === "gold" || f.accessibilityLevel === "silver")
  );
  const unknowns = bundle.features.filter((f) => f.availability === "unknown");

  return (
    <div className="space-y-8">
      <DemoDataBanner />

      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-[#005B7F] capitalize">
          {bundle.place.placeType.replace(/_/g, " ")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{bundle.place.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {bundle.place.address} · {bundle.place.region}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TierBadge tier={bundle.assessment.tier} />
          <ScoreLabel
            score={bundle.place.overallAccessibilityScore}
            confidence={bundle.place.confidenceScore}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Last verified:{" "}
          {new Date(bundle.place.lastVerifiedAt).toLocaleDateString("en-AU", { dateStyle: "long" })}
        </p>
        <p className="mt-4 text-sm">{bundle.assessment.disclaimer}</p>
      </header>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xl font-semibold">
          Plain-language summary
        </h2>
        <p className="mt-2">{bundle.place.accessSummaryPlainLanguage}</p>
        {strengths.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">What works well</h3>
            <ul className="mt-1 list-inside list-disc text-sm">
              {strengths.map((f) => (
                <li key={f.id}>{f.name}</li>
              ))}
            </ul>
          </div>
        )}
        {(barriers.length > 0 || bundle.place.warnings.length > 0) && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">What may be difficult</h3>
            <ul className="mt-1 list-inside list-disc text-sm">
              {[...barriers, ...bundle.place.warnings].map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        {unknowns.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">What needs confirmation</h3>
            <ul className="mt-1 list-inside list-disc text-sm">
              {unknowns.map((f) => (
                <li key={f.id}>{f.name}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="zones-heading">
        <h2 id="zones-heading" className="text-xl font-semibold">
          Access zones
        </h2>
        <ol className="mt-4 space-y-2">
          {sortedZones.map((zone) => (
            <li key={zone.id} className="rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">{zone.name}</span>
              <span className="text-muted-foreground">
                {" "}
                · {zone.zoneType.replace(/_/g, " ")}
                {zone.floorLabel ? ` · ${zone.floorLabel}` : ""}
              </span>
              {zone.notes && <p className="mt-1 text-muted-foreground">{zone.notes}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-xl font-semibold">
          Features
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Accessibility features at this place</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="p-2 font-semibold">
                  Feature
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Availability
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Level
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Measurements
                </th>
                <th scope="col" className="p-2 font-semibold">
                  Evidence
                </th>
              </tr>
            </thead>
            <tbody>
              {bundle.features.map((f) => (
                <tr key={f.id} className="border-b border-border">
                  <td className="p-2">{f.name}</td>
                  <td className="p-2 capitalize">{f.availability.replace(/_/g, " ")}</td>
                  <td className="p-2 capitalize">{f.accessibilityLevel}</td>
                  <td className="p-2">
                    {f.measurements
                      ? Object.entries(f.measurements)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="p-2">{f.sourceIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="paths-heading">
        <h2 id="paths-heading" className="text-xl font-semibold">
          Route and path segments
        </h2>
        <ul className="mt-4 space-y-3">
          {bundle.pathSegments.map((p) => (
            <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
              <p>
                {p.distanceMeters}m · {p.hasSteps ? "includes steps" : "step-free"}
                {p.hasRamp ? " · ramp available" : ""}
                {p.widthMm ? ` · width ${p.widthMm}mm` : ""}
              </p>
              {p.notes && <p className="mt-1 text-muted-foreground">{p.notes}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="text-xl font-semibold">
          Evidence
        </h2>
        <ul className="mt-4 space-y-3">
          {bundle.evidence.map((e) => (
            <li key={e.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{e.title}</p>
              <p className="text-muted-foreground capitalize">
                {e.evidenceType.replace(/_/g, " ")} · {e.confidence} confidence ·{" "}
                {new Date(e.capturedAt).toLocaleDateString("en-AU")}
              </p>
              <p className="mt-1">{e.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="issues-heading">
        <h2 id="issues-heading" className="text-xl font-semibold">
          Issues and updates
        </h2>
        <ul className="mt-4 space-y-3">
          {bundle.issues.map((i) => (
            <li key={i.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium capitalize">
                {i.issueType.replace(/_/g, " ")} · {i.severity} · {i.status.replace(/_/g, " ")}
              </p>
              <p className="mt-1">{i.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <CompatibilityChecker
        place={bundle.place}
        features={bundle.features}
        pathSegments={bundle.pathSegments}
      />

      <section aria-labelledby="actions-heading" className="flex flex-wrap gap-3">
        <h2 id="actions-heading" className="sr-only">
          Actions
        </h2>
        <button
          type="button"
          onClick={() => setShowEvidenceForm((v) => !v)}
          className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted/50"
        >
          {showEvidenceForm ? "Hide update form" : "Suggest an update"}
        </button>
        <button
          type="button"
          onClick={() => setShowIssueForm((v) => !v)}
          className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted/50"
        >
          {showIssueForm ? "Hide issue form" : "Report an issue"}
        </button>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-semibold text-white"
        >
          Request assessment
        </Link>
        <Link
          href="/dashboard/transport"
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Plan care and transport
        </Link>
      </section>

      {showEvidenceForm && (
        <EvidenceSubmissionForm
          placeId={bundle.place.id}
          placeName={bundle.place.name}
          featureOptions={bundle.features.map((f) => ({ id: f.id, name: f.name }))}
        />
      )}
      {showIssueForm && <IssueReportForm placeId={bundle.place.id} placeName={bundle.place.name} />}

      <DigitalTwinDisclaimerPanel />
    </div>
  );
}
