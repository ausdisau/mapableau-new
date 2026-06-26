"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DemoDataBanner } from "@/components/digital-twin/DemoDataBanner";
import { DigitalTwinDisclaimerPanel } from "@/components/digital-twin/DigitalTwinDisclaimerPanel";
import {
  DigitalTwinFilterPanel,
  type DigitalTwinFilters,
} from "@/components/digital-twin/DigitalTwinFilterPanel";
import { DigitalTwinMap } from "@/components/digital-twin/DigitalTwinMap";
import { DigitalTwinPlaceCard } from "@/components/digital-twin/DigitalTwinPlaceCard";
import { listPlaces } from "@/lib/digital-twin/digital-twin-service";
import { getCriticalBarriers } from "@/lib/digital-twin/scoring";

export default function DigitalTwinExplorerPage() {
  const [filters, setFilters] = useState<DigitalTwinFilters>({});
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const bundles = useMemo(() => listPlaces(filters), [filters]);

  const cards = bundles.map((b) => ({
    ...b.place,
    tier: b.assessment.tier,
    topStrengths: b.features
      .filter((f) => f.accessibilityLevel === "gold" || f.accessibilityLevel === "silver")
      .slice(0, 2)
      .map((f) => f.name),
    topBarriers: getCriticalBarriers(b.features).slice(0, 2),
  }));

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <DemoDataBanner />

      <header className="mt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[#005B7F]">
          MapAble Digital Twin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Preview access before you arrive
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          MapAble Digital Twin turns places, routes, services, evidence, and access needs into
          clear, practical information people can trust.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#places"
            className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-semibold text-white"
          >
            Explore demo places
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold"
          >
            Suggest a place to map
          </Link>
        </div>
      </header>

      <section aria-labelledby="explain-heading" className="mt-12">
        <h2 id="explain-heading" className="text-xl font-semibold">
          What is the Digital Twin?
        </h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          The Digital Twin is a living access model of real places — zones, routes, features,
          evidence, and assessments — not a VR-only world. It helps you understand what works, what
          may be difficult, and what still needs confirmation before you travel.
        </p>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <DigitalTwinFilterPanel filters={filters} onChange={setFilters} />
        <DigitalTwinMap
          places={bundles.map((b) => b.place)}
          selectedPlaceId={selectedId}
          onSelectPlace={setSelectedId}
        />
      </div>

      <section id="places" aria-labelledby="places-heading" className="mt-12">
        <h2 id="places-heading" className="text-xl font-semibold">
          Demo places
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {cards.map((place) => (
            <DigitalTwinPlaceCard key={place.id} place={place} />
          ))}
        </div>
        {cards.length === 0 && (
          <p className="mt-4 text-muted-foreground">No places match your filters.</p>
        )}
      </section>

      <section aria-labelledby="trust-heading" className="mt-12">
        <h2 id="trust-heading" className="text-xl font-semibold">
          Evidence levels
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Self-reported", "Individual observations submitted for review"],
            ["Community reviewed", "Multiple consistent community reports"],
            ["Professionally assessed", "Structured assessor inspection"],
            ["Imported status", "Data from trusted feeds or venue declarations"],
            ["Needs confirmation", "Information exists but is not yet verified"],
          ].map(([title, desc]) => (
            <li key={title} className="rounded-lg border border-border p-4 text-sm">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="boundary-heading" className="mt-12">
        <h2 id="boundary-heading" className="sr-only">
          Important boundary notice
        </h2>
        <DigitalTwinDisclaimerPanel />
      </section>

      <p className="mt-8 text-sm">
        <Link href="/digital-twin/intelligence" className="font-semibold text-[#005B7F] hover:underline">
          View privacy-safe intelligence summary
        </Link>
        {" · "}
        <Link href="/access-pass/demo" className="font-semibold text-[#005B7F] hover:underline">
          Access Pass demo
        </Link>
      </p>
    </main>
  );
}
