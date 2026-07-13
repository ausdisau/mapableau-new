"use client";

import Link from "next/link";
import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PlatformIntelligenceDomain,
  PlatformJourneyGraph,
} from "@/lib/care-intelligence/platform-registry";

export function PlatformIntelligenceMap({
  domains,
  journeyGraphs,
}: {
  domains: PlatformIntelligenceDomain[];
  journeyGraphs: PlatformJourneyGraph[];
}) {
  const [selectedId, setSelectedId] =
    useState<PlatformIntelligenceDomain["id"]>("care");
  const selected =
    domains.find((domain) => domain.id === selectedId) ?? domains[0];

  if (!selected) return null;

  return (
    <section
      aria-labelledby="platform-intelligence-title"
      className="space-y-5"
    >
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">
          Full platform architecture
        </p>
        <h2
          id="platform-intelligence-title"
          className="mt-2 font-heading text-2xl font-bold sm:text-3xl"
        >
          One kernel, five bounded domain packs
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Select a domain to inspect its role, first vertical slice and
          non-negotiable authority limits. “Design ready” means specified and
          testable—not active in production.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {domains.map((domain) => {
          const selectedDomain = domain.id === selected.id;
          return (
            <button
              key={domain.id}
              type="button"
              aria-pressed={selectedDomain}
              onClick={() => setSelectedId(domain.id)}
              className={`min-h-32 rounded-xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ${
                selectedDomain
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="block font-bold">{domain.shortName}</span>
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                  domain.status === "synthetic_live"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-sky-100 text-sky-950"
                }`}
              >
                {domain.statusLabel}
              </span>
              <span className="mt-3 block text-xs text-muted-foreground">
                {domain.scenarioCount} scenarios
              </span>
            </button>
          );
        })}
      </div>

      <Card variant="gradient">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold leading-none tracking-tight">
                {selected.name}
              </h3>
              <CardDescription className="mt-2 max-w-3xl">
                {selected.purpose}
              </CardDescription>
            </div>
            <Link
              href={selected.moduleHref}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            >
              Open {selected.shortName}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <h3 className="font-bold">First vertical slice</h3>
              <p className="mt-2 rounded-xl bg-primary/5 p-4 text-sm">
                {selected.firstVerticalSlice}
              </p>
            </div>
            <div>
              <h3 className="font-bold">Intelligence capabilities</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {selected.capabilities.map((capability) => (
                  <li key={capability}>{capability}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <h3 className="font-bold">Hard authority boundaries</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                {selected.hardBoundaries.map((boundary) => (
                  <li key={boundary}>{boundary}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Connected domains</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.connectedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Architecture: {selected.documentationPath}
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold">Cross-domain journey graphs</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {journeyGraphs.map((graph) => (
            <Card key={graph.id} variant="outlined">
              <CardHeader>
                <CardTitle>{graph.name}</CardTitle>
                <CardDescription>
                  {graph.scenarioCount} designed propagation scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{graph.outcome}</p>
                <div className="flex flex-wrap gap-2">
                  {graph.domains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-bold"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
                <p className="rounded-lg bg-amber-50 p-3 text-amber-950">
                  {graph.stopBoundary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
