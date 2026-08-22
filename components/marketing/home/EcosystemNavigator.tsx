import Link from "next/link";
import React from "react";

import {
  homepageEcosystemPathways,
  type EcosystemPathway,
} from "@/lib/marketing/mapable-care-combined-data";
import {
  mapableCareFocusRing,
  mapableCareGhostCtaClass,
} from "@/lib/marketing/mapable-care-tokens";

function PathwayIcon({ id }: { id: EcosystemPathway["id"] }) {
  const common = "h-6 w-6";
  switch (id) {
    case "access":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M12 3c-3.2 0-5.8 2.5-5.8 5.6 0 4 5.8 9.4 5.8 9.4s5.8-5.4 5.8-9.4C17.8 5.5 15.2 3 12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="8.6" r="1.8" fill="currentColor" />
        </svg>
      );
    case "care":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "transport":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M4 13h16l-1.2-6.2A2 2 0 0 0 16.85 5H7.15a2 2 0 0 0-1.95 1.8L4 13Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
          <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "jobs":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={common}>
          <rect
            x="3.5"
            y="8"
            width="17"
            height="11"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9 8V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8V8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function EcosystemNavigator() {
  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="relative overflow-hidden border-y border-mapable-border bg-white"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1200 80"
        className="pointer-events-none absolute inset-x-0 top-8 hidden h-20 w-full text-mapable-violet/25 lg:block"
      >
        <path
          d="M80 50 C 280 10, 480 70, 680 30 S 1040 20, 1120 48"
          fill="none"
          stroke="url(#ecosystem-line)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ecosystem-line" x1="80" y1="40" x2="1120" y2="40">
            <stop offset="0" stopColor="#1E5A8A" />
            <stop offset="0.4" stopColor="#72549D" />
            <stop offset="0.75" stopColor="#F47A2A" />
            <stop offset="1" stopColor="#F1B51C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
          Explore MapAble
        </p>
        <h2
          id="ecosystem-heading"
          className="mt-3 max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
        >
          Access, care, transport, and work — connected.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-mapable-text-muted">
          Use the accessibility map today. Care, Transport, and Jobs are
          programme information and controlled-pilot pathways — not general
          bookings or automated assignment.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {homepageEcosystemPathways.map((pathway) => (
            <li
              key={pathway.id}
              className="rounded-[1.5rem] border border-mapable-border bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-mapable-surface-blue text-mapable-primary">
                  <PathwayIcon id={pathway.id} />
                </span>
                <p
                  className={
                    pathway.statusKind === "live"
                      ? "rounded-full border border-mapable-primary/20 bg-mapable-surface-blue px-3 py-1 text-xs font-black text-mapable-primary"
                      : "rounded-full border border-mapable-border bg-mapable-surface px-3 py-1 text-xs font-black text-mapable-text-muted"
                  }
                >
                  {pathway.status}
                </p>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-black text-mapable-text">
                {pathway.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-mapable-primary">
                {pathway.kicker}
              </p>
              <p className="mt-3 text-base leading-[1.65] text-mapable-text-muted">
                {pathway.body}
              </p>
              <Link
                href={pathway.href}
                className={`${mapableCareGhostCtaClass} mt-4 px-0 ${mapableCareFocusRing}`}
              >
                {pathway.linkLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
