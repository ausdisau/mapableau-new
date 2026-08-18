import Link from "next/link";
import React from "react";

import { homepageMapProofExample } from "@/lib/marketing/mapable-care-combined-data";
import {
  mapableCareCtaClass,
  mapableCareGhostCtaClass,
} from "@/lib/marketing/mapable-care-tokens";

export function AccessibilityMapProof() {
  const example = homepageMapProofExample;

  return (
    <section
      aria-labelledby="map-proof-heading"
      className="bg-mapable-surface-blue"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
            Accessibility map
          </p>
          <h2
            id="map-proof-heading"
            className="mt-3 max-w-xl font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
          >
            Evidence you can take to the door.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-[1.65] text-mapable-text-muted">
            MapAble publishes measurements, confidence, sources, and last-checked
            dates so you can plan a visit. It does not collapse access into a
            single opaque score, and it does not choose a venue for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/accessibility-map" className={mapableCareCtaClass}>
              Explore accessible places
            </Link>
            <Link href="/about" className={mapableCareGhostCtaClass}>
              Learn how MapAble accessibility evidence works
            </Link>
          </div>
        </div>
        <article
          aria-labelledby="example-record-heading"
          className="rounded-[1.5rem] border border-mapable-border bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.14em] text-mapable-tagline">
            {example.label}
          </p>
          <h3
            id="example-record-heading"
            className="mt-3 font-heading text-2xl font-black text-mapable-text"
          >
            {example.name}
          </h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-mapable-text-muted">
                Accessibility confidence
              </dt>
              <dd className="mt-1 font-black text-mapable-text">
                {example.confidence}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-mapable-text-muted">
                Last checked
              </dt>
              <dd className="mt-1 font-black text-mapable-text">
                {example.lastChecked}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-mapable-text-muted">
                Door clear width
              </dt>
              <dd className="mt-1 font-black text-mapable-text">
                {example.doorClearWidth}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-mapable-text-muted">Evidence</dt>
              <dd className="mt-1 font-black text-mapable-text">
                {example.evidence}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-semibold text-mapable-text">Features</p>
          <ul className="mt-2 space-y-2 text-sm text-mapable-text-muted">
            {example.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-mapable-primary" aria-hidden="true">
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-mapable-text-muted">
            {example.accreditationExample}. This preview is labelled as an
            example and does not describe a verified venue.
          </p>
        </article>
      </div>
    </section>
  );
}
