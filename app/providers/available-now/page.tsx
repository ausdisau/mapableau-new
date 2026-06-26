"use client";

import { useMemo, useState } from "react";

import { AccessFitSummary } from "@/components/wedges/access-fit/AccessFitSummary";
import { AvailabilityFilterPanel } from "@/components/wedges/availability/AvailabilityFilterPanel";
import { ProviderAvailabilityCard } from "@/components/wedges/availability/ProviderAvailabilityCard";
import { ResponseTimeBadge } from "@/components/wedges/trust/ResponseTimeBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { accessFitScore } from "@/lib/access-fit/score";
import { filterProvidersByAvailability } from "@/lib/wedges/availability/filters";
import {
  DEMO_ACCESS_PROFILE,
  MOCK_RESPONSE_SLA,
  MOCK_WEDGE_PROVIDERS,
} from "@/lib/wedges/mock-providers";
import { AVAILABILITY_DISCLAIMER, type AvailabilityFilters } from "@/types/wedges";
import Link from "next/link";

export default function AvailableNowPage() {
  const [filters, setFilters] = useState<AvailabilityFilters>({
    noWaitlist: false,
    availableThisWeek: false,
  });

  const results = useMemo(
    () => filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, filters),
    [filters],
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header>
        <h1 className="font-heading text-3xl font-bold">Available now</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Providers currently indicating capacity to accept new participants or
          offer near-term starts. Confirm availability before booking.
        </p>
        <p className="mt-2 text-xs text-muted-foreground" role="note">
          Demo data shown for illustration. {AVAILABILITY_DISCLAIMER}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <AvailabilityFilterPanel filters={filters} onChange={setFilters} />
        </aside>

        <section aria-labelledby="results-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="results-heading" className="font-heading text-xl font-semibold">
              {results.length} provider{results.length === 1 ? "" : "s"}
            </h2>
            <Button variant="outline" size="default" asChild>
              <Link href="/request-support">Request introduction</Link>
            </Button>
          </div>

          {results.length === 0 ? (
            <Card variant="outlined" className="mt-6 p-8 text-center">
              <h3 className="text-lg font-semibold">No providers match these filters</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try removing a filter or broadening your location. You can also register
                unmet need through our request concierge.
              </p>
              <Button variant="default" size="default" className="mt-4" asChild>
                <Link href="/request-support">Register what you need</Link>
              </Button>
            </Card>
          ) : (
            <ul className="mt-6 space-y-6">
              {results.map((provider) => (
                <li key={provider.id}>
                  <article className="space-y-4 rounded-xl border border-border p-5">
                    <header>
                      <h3 className="font-heading text-lg font-semibold">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {provider.suburb} {provider.state} · {provider.categories.join(", ")}
                      </p>
                    </header>
                    <ProviderAvailabilityCard availability={provider.availability} />
                    <AccessFitSummary
                      result={accessFitScore(
                        DEMO_ACCESS_PROFILE,
                        provider.accessCapabilities,
                      )}
                    />
                    {MOCK_RESPONSE_SLA[provider.id] ? (
                      <ResponseTimeBadge sla={MOCK_RESPONSE_SLA[provider.id]} />
                    ) : null}
                    <Button variant="default" size="default" asChild>
                      <Link href="/request-support">Request introduction</Link>
                    </Button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
