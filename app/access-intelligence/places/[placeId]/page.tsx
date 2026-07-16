import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { EvidenceList } from "@/components/access-intelligence/evidence-list";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getDemoGraph, DEMO_INCIDENTS } from "@/lib/access-intelligence/demo-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Props = { params: Promise<{ placeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { placeId } = await params;
  const graph = getDemoGraph(placeId);
  return {
    title: graph
      ? `${graph.place.name} | Access Intelligence`
      : "Place | Access Intelligence",
  };
}

export default async function AccessPlacePage({ params }: Props) {
  const { placeId } = await params;
  const graph = getDemoGraph(placeId);
  if (!graph) notFound();

  const incidents = DEMO_INCIDENTS.filter((i) => i.placeId === placeId);

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title={graph.place.name}
        description={`${graph.place.address}. Synthetic demo place — measurements do not represent a real venue.`}
      >
        <div className="space-y-8">
          <section aria-labelledby="baseline-heading">
            <h2 id="baseline-heading" className="text-xl font-black">
              Venue access baseline
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Baseline score</dt>
                <dd className="text-lg font-black">
                  {graph.place.baselineScore ?? "n/a"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Last verified</dt>
                <dd>
                  {graph.place.lastVerifiedAt
                    ? new Date(graph.place.lastVerifiedAt).toLocaleDateString()
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Operator</dt>
                <dd>{graph.place.operator ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="elements-heading">
            <h2 id="elements-heading" className="text-xl font-black">
              Building elements
            </h2>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {graph.elements.map((el) => (
                <li key={el.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="font-bold">{el.name}</span>
                  <span className="text-slate-600">
                    {" "}
                    · {el.type.replaceAll("_", " ")}
                    {el.level ? ` · level ${el.level}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading" className="text-xl font-black">
              Access features
            </h2>
            <ul className="mt-3 space-y-2">
              {graph.features.map((f) => (
                <li key={f.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="font-semibold">
                    {f.featureType.replaceAll("_", " ")}: {String(f.value)}
                    {f.unit ? ` ${f.unit}` : ""}
                  </p>
                  <p className="text-slate-600">
                    Source: {f.sourceType.replaceAll("_", " ")} · Observed{" "}
                    {new Date(f.observedAt).toLocaleDateString()}
                    {f.sourceType === "ai_inference"
                      ? " · AI inference (not a measurement)"
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="evidence-heading">
            <h2 id="evidence-heading" className="text-xl font-black">
              Evidence
            </h2>
            <div className="mt-3">
              <EvidenceList items={graph.evidence} />
            </div>
          </section>

          {incidents.length > 0 ? (
            <section aria-labelledby="incidents-heading">
              <h2 id="incidents-heading" className="text-xl font-black">
                Live incidents (demo)
              </h2>
              <ul className="mt-3 space-y-2">
                {incidents.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm text-amber-950"
                  >
                    <strong>{i.type.replaceAll("_", " ")}</strong> — {i.description}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <a
            href="/access-intelligence"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Ask Access Intelligence about this place
          </a>
        </div>
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
