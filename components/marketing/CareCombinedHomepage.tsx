"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MapAbleButton } from "@/components/marketing/mapable/MapAbleButton";
import { AskMapAbleTrigger } from "@/components/marketing/mapable/AskMapAbleTrigger";
import { SearchInput } from "@/components/marketing/mapable/SearchInput";
import { SectionEyebrow } from "@/components/marketing/mapable/SectionEyebrow";
import {
  SponsoredPartnerStrip,
  type SponsoredPartner,
} from "@/components/marketing/mapable/SponsoredPartnerStrip";
import { TrustMetricCard } from "@/components/marketing/mapable/TrustMetricCard";
import { TrustAndSafetyBand } from "@/components/marketing/mapable/trust/TrustAndSafetyBand";
import { PrivacyNotice } from "@/components/marketing/mapable/trust/PrivacyNotice";
import { WavyText } from "@/components/marketing/mapable/WavyText";
import { MAPABLE_POSITIONING } from "@/lib/brand/tokens";
import { SAMPLE_SPONSORED_PARTNERS } from "@/lib/provider-finder/mock-data";
import { buildProviderFinderQuery } from "@/lib/provider-finder/search-params";

const SUPPORT_AREAS = [
  { label: "Care", href: "/provider-finder?support=personal-care" },
  { label: "Transport", href: "/provider-finder?support=transport" },
  { label: "NDIS Help", href: "/ask" },
  { label: "Jobs", href: "/provider-finder?support=employment" },
  { label: "Access", href: "/provider-finder#map" },
] as const;

const MARKETPLACE_TILES = [
  {
    title: "Find care",
    description: "Compare support workers and providers with funding and access filters.",
    href: "/provider-finder",
  },
  {
    title: "Plan transport",
    description: "Accessible trips with travel context — not a separate search.",
    href: "/provider-finder?support=transport",
  },
  {
    title: "NDIS guidance",
    description: "Practical help understanding options — with human support when you need it.",
    href: "/ask",
  },
  {
    title: "Inclusive jobs",
    description: "Employment support that fits your access and transport needs.",
    href: "/provider-finder?support=employment",
  },
] as const;

const TRUST_METRICS = [
  { value: "1", label: "guided journey across care, transport and access" },
  { value: "5+", label: "support areas in one search experience" },
  { value: "100%", label: "you stay in control before any enquiry is sent" },
] as const;

export function CareCombinedHomepage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function handleFindSupport(e: React.FormEvent) {
    e.preventDefault();
    const qs = buildProviderFinderQuery({ q: query, location });
    router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
  }

  const partners: SponsoredPartner[] = SAMPLE_SPONSORED_PARTNERS.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    label: p.label,
  }));

  return (
    <>
      <section
        className="relative overflow-hidden bg-gradient-to-b from-white via-mapable-soft to-mapable-soft/80 py-14 sm:py-20"
        aria-labelledby="hero-heading"
      >
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <SectionEyebrow>Combined care & support</SectionEyebrow>
            <h1 id="hero-heading" className="mt-3">
              <WavyText
                as="span"
                text={MAPABLE_POSITIONING.headline}
                className="block text-4xl font-bold text-mapable-navy sm:text-5xl"
              />
            </h1>
            <p className="mapable-soft mt-4 text-lg leading-relaxed text-slate-600">
              {MAPABLE_POSITIONING.subheadline}
            </p>
            <p className="mapable-soft mt-2 text-sm font-medium text-mapable-teal">
              {MAPABLE_POSITIONING.differentiators[0]}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MapAbleButton href="/provider-finder" variant="primary">
                Find support
              </MapAbleButton>
              <MapAbleButton href="#mapable-difference" variant="outline">
                Why MapAble is different
              </MapAbleButton>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Support areas">
              {SUPPORT_AREAS.map((a) => (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    className="mapable-focus-ring inline-flex min-h-10 items-center rounded-full border border-mapable-blue/20 bg-white px-4 text-sm font-medium text-mapable-blue hover:bg-mapable-blue/5"
                  >
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg"
            id="find-support"
          >
            <h2 className="mapable-display text-xl font-bold text-mapable-navy">
              Guided search
            </h2>
            <p className="mapable-soft mt-1 text-sm text-slate-600">
              Start blank — tell us what you need and where you are.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleFindSupport}>
              <SearchInput
                id="home-support-query"
                label="What support are you looking for?"
                value={query}
                onChange={setQuery}
                placeholder=""
              />
              <SearchInput
                id="home-location"
                label="Suburb or postcode"
                value={location}
                onChange={setLocation}
                placeholder=""
                type="text"
              />
              <div className="flex flex-wrap gap-2">
                <MapAbleButton type="submit" variant="primary">
                  Find support
                </MapAbleButton>
                <AskMapAbleTrigger variant="button" context="homepage-hero" />
              </div>
            </form>
            <div className="mt-4">
              <PrivacyNotice />
            </div>
          </div>
        </div>
      </section>

      <SponsoredPartnerStrip partners={partners} />

      <section className="container mx-auto max-w-6xl px-4 py-12" aria-labelledby="trust-metrics">
        <h2 id="trust-metrics" className="sr-only">
          Trust metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST_METRICS.map((m) => (
            <TrustMetricCard key={m.label} value={m.value} label={m.label} />
          ))}
        </div>
      </section>

      <section
        className="border-y border-slate-200/80 bg-white py-14"
        aria-labelledby="journey-heading"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <SectionEyebrow>Guided support journey</SectionEyebrow>
          <h2
            id="journey-heading"
            className="mapable-display mt-2 text-2xl font-bold text-mapable-navy sm:text-3xl"
          >
            One journey, not five separate searches.
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              "Search with care, transport and access context together.",
              "Compare funding, availability and access before you enquire.",
              "Choose your next step — profile, compare, or Ask MapAble.",
            ].map((step, i) => (
              <li
                key={step}
                className="rounded-2xl border border-slate-200 bg-mapable-soft/50 p-6"
              >
                <span className="mapable-display text-3xl font-bold text-mapable-teal">
                  {i + 1}
                </span>
                <p className="mapable-soft mt-3 text-sm leading-relaxed text-slate-700">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-14" aria-labelledby="marketplace-heading">
        <SectionEyebrow>Combined marketplace</SectionEyebrow>
        <h2
          id="marketplace-heading"
          className="mapable-display mt-2 text-2xl font-bold text-mapable-navy"
        >
          More than a care marketplace.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {MARKETPLACE_TILES.map((tile) => (
            <Link
              key={tile.title}
              href={tile.href}
              className="mapable-focus-ring rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-mapable-blue/30 hover:shadow-md"
            >
              <h3 className="mapable-display text-lg font-semibold text-mapable-navy">
                {tile.title}
              </h3>
              <p className="mapable-soft mt-2 text-sm text-slate-600">{tile.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="mapable-difference"
        className="bg-mapable-blue/5 py-14"
        aria-labelledby="difference-heading"
      >
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2
            id="difference-heading"
            className="mapable-display text-2xl font-bold text-mapable-navy sm:text-3xl"
          >
            The MapAble difference
          </h2>
          <ul className="mapable-soft mx-auto mt-6 max-w-2xl space-y-3 text-left text-slate-700">
            {MAPABLE_POSITIONING.differentiators.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-mapable-teal" aria-hidden>
                  •
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TrustAndSafetyBand />
    </>
  );
}
