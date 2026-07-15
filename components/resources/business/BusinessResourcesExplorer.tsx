"use client";

import React, { useMemo, useState } from "react";

import { BusinessResourceCard } from "@/components/resources/business/BusinessResourceCard";
import {
  BusinessResourceFilters,
  type BusinessResourceFiltersState,
} from "@/components/resources/business/BusinessResourceFilters";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import { filterBusinessResources } from "@/lib/resources/business-resources-data";
import type {
  BusinessBarrierType,
  BusinessResource,
  BusinessResourceAudience,
  BusinessResourceFormat,
} from "@/types/business-resource";

const AUDIENCES: BusinessResourceAudience[] = [
  "businesses",
  "venues",
  "providers",
  "employers",
  "event-organisers",
];

const FORMATS: BusinessResourceFormat[] = [
  "self-check",
  "guide",
  "checklist",
  "generator",
  "playbook",
  "kit",
];

const BARRIERS: BusinessBarrierType[] = [
  "physical",
  "toilet",
  "sensory",
  "communication",
  "digital",
  "transport",
  "attitudinal",
  "employment",
  "pricing",
  "feedback",
];

export function BusinessResourcesExplorer({
  resources,
  initialAudience = null,
}: {
  resources: BusinessResource[];
  initialAudience?: BusinessResourceAudience | null;
}) {
  const [filters, setFilters] = useState<BusinessResourceFiltersState>({
    query: "",
    audience: initialAudience,
    format: null,
    barrier: null,
  });

  const visible = useMemo(
    () =>
      filterBusinessResources({
        query: filters.query,
        audience: filters.audience,
        format: filters.format,
        barrier: filters.barrier,
      }).filter((resource) =>
        resources.some((item) => item.id === resource.id),
      ),
    [filters, resources],
  );

  return (
    <div className="space-y-8">
      <div className={mapablePublicCardClass}>
        <h2 className="text-lg font-black text-[#0C1833] sm:text-xl">
          Browse business resources
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Filter by audience (including Businesses and Venues), format or
          barrier type. Result counts are announced for screen-reader users.
        </p>
        <div className="mt-6">
          <BusinessResourceFilters
            filters={filters}
            audiences={AUDIENCES}
            formats={FORMATS}
            barriers={BARRIERS}
            resultCount={visible.length}
            onChange={setFilters}
          />
        </div>
      </div>

      <section aria-labelledby="business-resource-results-heading">
        <h2
          id="business-resource-results-heading"
          className="text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Resource list
        </h2>
        {visible.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-700">
            No resources match those filters yet. Clear a filter to see the full
            list.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((resource) => (
              <BusinessResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
