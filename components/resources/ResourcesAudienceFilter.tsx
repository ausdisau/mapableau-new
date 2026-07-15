"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type AudienceFilter = "all" | "businesses" | "venues" | "participants" | "providers";

type HubLink = {
  id: string;
  title: string;
  description: string;
  href: string;
  audiences: AudienceFilter[];
};

const HUB_LINKS: HubLink[] = [
  {
    id: "business",
    title: "Business Access Resources",
    description:
      "Self-checks, service guides and access statement tools for businesses and venues.",
    href: "/resources/business",
    audiences: ["businesses", "venues", "providers"],
  },
  {
    id: "tours",
    title: "Accessible Tours",
    description:
      "Map-based outings with list-view itineraries, toilets, quiet spaces and transport notes.",
    href: "/resources/tours",
    audiences: ["participants", "venues"],
  },
  {
    id: "guides",
    title: "Access Guides",
    description:
      "Capital and regional accessibility guides for Australian cities and towns.",
    href: "/guides",
    audiences: ["participants", "venues", "businesses"],
  },
  {
    id: "for-providers",
    title: "For providers",
    description:
      "Register interest and review MapAble provider pathways for controlled pilots.",
    href: "/for-providers",
    audiences: ["providers", "businesses"],
  },
  {
    id: "employment",
    title: "MapAble Employment",
    description:
      "Workplace access context, job support pathways and rights-aware workflows.",
    href: "/employment",
    audiences: ["businesses", "providers", "participants"],
  },
];

const FILTERS: Array<{ id: AudienceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "businesses", label: "Businesses" },
  { id: "venues", label: "Venues" },
  { id: "participants", label: "Participants" },
  { id: "providers", label: "Providers" },
];

export function ResourcesAudienceFilter() {
  const [audience, setAudience] = useState<AudienceFilter>("all");

  const visible = useMemo(() => {
    if (audience === "all") return HUB_LINKS;
    return HUB_LINKS.filter((link) => link.audiences.includes(audience));
  }, [audience]);

  return (
    <section
      id="resource-audience-filter"
      className="border-b border-slate-200 bg-white"
      aria-labelledby="resource-audience-filter-heading"
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Browse by audience</p>
        <h2
          id="resource-audience-filter-heading"
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Find resources for your role
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Filter the hub by Businesses, Venues and other audiences. Essential
          links stay available as ordinary cards — not only inside the filter
          controls.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Audience filters">
          {FILTERS.map((filter) => {
            const pressed = audience === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setAudience(filter.id)}
                className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-bold ${mapableCareFocusRing} ${
                  pressed
                    ? "border-[#005B7F] bg-[#005B7F] text-white"
                    : "border-slate-200 bg-white text-[#005B7F] hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600" aria-live="polite">
          Showing {visible.length} resource group
          {visible.length === 1 ? "" : "s"}.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm ${mapableCareFocusRing}`}
            >
              <h3 className="text-lg font-black text-[#0C1833]">{link.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {link.description}
              </p>
              <p className="mt-4 text-sm font-bold text-[#005B7F]">
                Open
                <span aria-hidden="true"> →</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
