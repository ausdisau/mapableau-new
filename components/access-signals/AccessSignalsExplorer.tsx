"use client";

import { useMemo, useState } from "react";

import { evaluateFeature, evaluateRoute } from "@/lib/access/signals/evaluate";
import { makeSyntheticNetwork } from "@/lib/access/signals/network-fixture";
import { RAGU_LEGEND, getRaguDescriptor } from "@/lib/access/signals/ragu";
import type { RagStatus } from "@/lib/access/signals/types";

import { RaguIcon } from "./SignalsRaguIcon";

export function AccessSignalsExplorer() {
  const network = useMemo(() => makeSyntheticNetwork(), []);
  const [ragFilter, setRagFilter] = useState<RagStatus | "all">("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    network.features[0]?.featureId ?? null,
  );

  const featureResults = useMemo(() => {
    const map = new Map(
      network.features.map((feature) => [feature.featureId, evaluateFeature(feature)]),
    );
    return map;
  }, [network]);

  const featureInputs = useMemo(
    () => new Map(network.features.map((feature) => [feature.featureId, feature])),
    [network],
  );

  const routeResults = useMemo(
    () =>
      network.routes.map((route) => ({
        route,
        result: evaluateRoute(route, featureResults, featureInputs),
      })),
    [network, featureResults, featureInputs],
  );

  const domains = useMemo(
    () => Array.from(new Set(network.features.map((feature) => feature.domain))),
    [network],
  );

  const listItems = network.features.filter((feature) => {
    const result = featureResults.get(feature.featureId)!;
    if (ragFilter !== "all" && result.status !== ragFilter) return false;
    if (domainFilter !== "all" && feature.domain !== domainFilter) return false;
    if (
      query &&
      !`${feature.label} ${feature.domain}`.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selected = selectedFeatureId
    ? network.features.find((feature) => feature.featureId === selectedFeatureId)
    : null;
  const selectedResult = selectedFeatureId
    ? featureResults.get(selectedFeatureId)
    : null;

  return (
    <div className="space-y-6" data-testid="access-signals-explorer">
      <div
        className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        role="status"
      >
        <p className="font-bold">Synthetic disclosure</p>
        <p className="mt-1">{network.disclosure}</p>
        <p className="mt-1">
          This is not a certification, Access Mark score, or live place rating.
        </p>
      </div>

      <section aria-labelledby="ragu-legend-heading" className="space-y-2">
        <h2 id="ragu-legend-heading" className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Status legend (shape + text — never colour alone)
        </h2>
        <ul className="flex flex-wrap gap-3">
          {RAGU_LEGEND.map((item) => (
            <li key={item.status} className="inline-flex items-center gap-2 text-sm">
              <RaguIcon status={item.status} />
              <span>{item.legendDescription}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-semibold">
          RAG filter
          <select
            className="ml-2 min-h-11 rounded-lg border border-slate-200 px-2"
            value={ragFilter}
            onChange={(event) =>
              setRagFilter(event.target.value as RagStatus | "all")
            }
          >
            <option value="all">All</option>
            {RAGU_LEGEND.map((item) => (
              <option key={item.status} value={item.status}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Domain
          <select
            className="ml-2 min-h-11 rounded-lg border border-slate-200 px-2"
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
          >
            <option value="all">All</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Search
          <input
            className="ml-2 min-h-11 rounded-lg border border-slate-200 px-3"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Feature or domain"
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="signals-map-heading"
          className="rounded-2xl border border-slate-200 bg-[#F8FBFE] p-4"
        >
          <h2 id="signals-map-heading" className="font-heading text-lg font-bold text-[#0C1833]">
            Map — {network.precinctName}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Positions are synthetic (0–100 grid). Not real geolocation.
          </p>
          <div
            className="relative mt-4 h-72 w-full rounded-xl border border-slate-200 bg-white"
            role="img"
            aria-label={`Synthetic map of ${network.precinctName}`}
          >
            {network.edges.map((edge) => {
              const from = network.zones.find((zone) => zone.id === edge.fromZoneId);
              const to = network.zones.find((zone) => zone.id === edge.toZoneId);
              if (!from || !to) return null;
              return (
                <svg
                  key={edge.id}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <line
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke="#94A3B8"
                    strokeWidth="2"
                  />
                </svg>
              );
            })}
            {network.zones.map((zone) => {
              const result = featureResults.get(zone.featureId)!;
              return (
                <button
                  key={zone.id}
                  type="button"
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                  onClick={() => setSelectedFeatureId(zone.featureId)}
                  aria-pressed={selectedFeatureId === zone.featureId}
                >
                  <RaguIcon status={result.status} size={24} />
                  <span className="rounded bg-white/90 px-1 text-[10px] font-bold text-[#0C1833]">
                    {zone.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="signals-list-heading" className="space-y-3">
          <h2 id="signals-list-heading" className="font-heading text-lg font-bold text-[#0C1833]">
            Equivalent list
          </h2>
          {listItems.length === 0 ? (
            <p className="text-sm text-slate-600" role="status">
              No features match the current filters.
            </p>
          ) : (
            <ul className="space-y-2">
              {listItems.map((feature) => {
                const result = featureResults.get(feature.featureId)!;
                const descriptor = getRaguDescriptor(result.status);
                return (
                  <li key={feature.featureId}>
                    <button
                      type="button"
                      className="flex w-full min-h-11 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                      onClick={() => setSelectedFeatureId(feature.featureId)}
                      aria-pressed={selectedFeatureId === feature.featureId}
                    >
                      <RaguIcon status={result.status} />
                      <span>
                        <span className="block font-bold text-[#0C1833]">
                          {feature.label}
                        </span>
                        <span className="block text-sm text-slate-600">
                          {descriptor.label}: {descriptor.shortDescription} ·{" "}
                          {feature.domain}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {selected && selectedResult ? (
        <section
          aria-labelledby="evidence-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5"
          data-testid="access-signals-evidence"
        >
          <h2 id="evidence-heading" className="font-heading text-xl font-bold text-[#0C1833]">
            Evidence — {selected.label}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <RaguIcon status={selectedResult.status} />
            <span>
              {getRaguDescriptor(selectedResult.status).label}:{" "}
              {selectedResult.explanation}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Rule version: {selectedResult.ruleVersion}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {selected.observations.length === 0 ? (
              <li>No observations — insufficient evidence.</li>
            ) : (
              selected.observations.map((observation) => (
                <li key={observation.id}>
                  {observation.id}: {String(observation.value)} (
                  {observation.flags.join(", ")})
                </li>
              ))
            )}
          </ul>
          {selectedResult.limitations.length > 0 ? (
            <div className="mt-3">
              <h3 className="text-sm font-extrabold uppercase text-slate-500">
                Limitations
              </h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {selectedResult.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.verifiedAlternativeIds && selected.verifiedAlternativeIds.length > 0 ? (
            <p className="mt-3 text-sm">
              Verified alternatives (do not clear barrier):{" "}
              {selected.verifiedAlternativeIds.join(", ")}
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="routes-heading" className="space-y-2">
        <h2 id="routes-heading" className="font-heading text-lg font-bold text-[#0C1833]">
          Routes
        </h2>
        <ul className="space-y-2">
          {routeResults.map(({ route, result }) => (
            <li
              key={route.routeId}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"
            >
              <RaguIcon status={result.status} />
              <div>
                <p className="font-bold text-[#0C1833]">{route.label}</p>
                <p>
                  {getRaguDescriptor(result.status).label}: {result.explanation}
                </p>
                {!route.networkComplete ? (
                  <p className="mt-1 font-semibold text-slate-700">
                    Incomplete network = insufficient evidence
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
