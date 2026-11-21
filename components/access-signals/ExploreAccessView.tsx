"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { RaguIcon } from "@/components/access-signals/RaguIcon";
import {
  DEMO_ROUTES,
  type AccessDomain,
  type DemoRoute,
} from "@/lib/access-signals/demo-data";
import { RAGU_LEGEND, raguAnnouncement } from "@/lib/access-signals/ragu";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const FOCUS: { id: AccessDomain; label: string }[] = [
  { id: "physical", label: "Physical" },
  { id: "sensory", label: "Sensory" },
  { id: "cognitive", label: "Cognitive" },
];

export function ExploreAccessView() {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<AccessDomain>("physical");
  const [selectedId, setSelectedId] = useState(DEMO_ROUTES[0].id);

  const routes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_ROUTES.filter((route) => {
      const matchesQuery =
        !q ||
        route.name.toLowerCase().includes(q) ||
        route.description.toLowerCase().includes(q);
      const matchesFocus = route.segments.some((s) => s.domain === focus);
      return matchesQuery && matchesFocus;
    });
  }, [query, focus]);

  const selected: DemoRoute =
    routes.find((r) => r.id === selectedId) ?? routes[0] ?? DEMO_ROUTES[0];

  const focusedSegments = selected.segments.filter((s) => s.domain === focus);
  const routeSignal =
    focusedSegments.find((s) => s.status === "red")?.status ??
    focusedSegments.find((s) => s.status === "unknown")?.status ??
    focusedSegments.find((s) => s.status === "amber")?.status ??
    focusedSegments[0]?.status ??
    "unknown";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-[#0C1833] sm:text-4xl">
              Explore access along a route
            </h1>
            <p className="mt-1 text-slate-600">
              Illustrative route data · Not for travel
            </p>
          </div>
          <span className="inline-flex min-h-9 items-center rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-900">
            Illustrative route
          </span>
        </div>
        <label className="block">
          <span className="sr-only">Search places or routes</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places or routes"
            className={`mt-2 min-h-12 w-full rounded-xl border border-[#0C1833]/30 bg-white px-4 text-base ${mapableInteractiveFocusRing}`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <p className="text-sm font-semibold text-slate-700">Focus on:</p>
          {FOCUS.map((item) => {
            const active = focus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFocus(item.id)}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold ${mapableInteractiveFocusRing} ${
                  active
                    ? "border-[#0C1833] bg-[#0C1833] text-white"
                    : "border-[#0C1833] bg-white text-[#0C1833]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="list-view-heading" className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
            Accessible alternative
          </p>
          <h2 id="list-view-heading" className="font-heading text-2xl font-bold">
            List view
          </h2>
          <p className="text-sm text-slate-600">
            Fictional example · No verified access rating
          </p>
          {routes.length === 0 ? (
            <p role="status">No illustrative routes match the selected search and focus.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedId(route.id)}
                    className={`inline-flex min-h-11 items-center rounded-xl border px-3 text-sm font-bold ${mapableInteractiveFocusRing} ${
                      selected.id === route.id
                        ? "border-[#0C1833] bg-[#0C1833] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>
              <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xl font-bold">{selected.name}</h3>
                <p className="text-slate-700">{selected.description}</p>
                <ol className="space-y-3">
                  {focusedSegments.map((segment) => (
                    <li
                      key={segment.id}
                      className="flex gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C1833] text-sm font-bold text-white"
                        aria-hidden
                      >
                        {segment.number}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{segment.name}</p>
                          <RaguIcon status={segment.status} />
                          <span className="text-sm font-bold">
                            {raguAnnouncement(segment.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{segment.summary}</p>
                        <Link
                          href="/access-signals/evidence"
                          className={`text-sm font-bold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}
                        >
                          View evidence and limitations
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="rounded-xl bg-slate-50 p-3 text-sm" role="status">
                  <strong>Route signal for {focus}:</strong>{" "}
                  {raguAnnouncement(routeSignal)}. A critical segment may need
                  evidence.
                </p>
                <Link
                  href={`/access-signals/field-notes?route=${selected.id}`}
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F97316] px-5 text-base font-bold text-[#0C1833] ${mapableInteractiveFocusRing}`}
                >
                  View route details
                </Link>
                <p>
                  <Link
                    href="/access-signals/evidence"
                    className={`font-bold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}
                  >
                    Evidence and limitations
                  </Link>
                </p>
              </article>
            </div>
          )}
        </section>

        <section aria-labelledby="map-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
                Visual overview
              </p>
              <h2 id="map-heading" className="font-heading text-2xl font-bold">
                Route map
              </h2>
            </div>
            <p className="text-sm text-slate-600">Fictional geography</p>
          </div>
          <IllustrativeMap route={selected} focus={focus} />
          <p className="text-sm text-slate-600">
            Fictional map; not directions for travel. Select a marker or use the
            text list to view its evidence.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">Legend</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {RAGU_LEGEND.map((item) => (
                <li key={item.status} className="flex items-center gap-2 text-sm">
                  <RaguIcon status={item.status} />
                  <span>{item.legendDescription}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function IllustrativeMap({
  route,
  focus,
}: {
  route: DemoRoute;
  focus: AccessDomain;
}) {
  const segments = route.segments.filter((s) => s.domain === focus).slice(0, 3);
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F3EDE3]"
      role="img"
      aria-label={`Illustrative map for ${route.name}. Use the list view for the accessible alternative.`}
    >
      <svg viewBox="0 0 480 320" className="h-auto w-full" aria-hidden>
        <rect width="480" height="320" fill="#F3EDE3" />
        <rect x="40" y="40" width="90" height="70" fill="#E7DCC8" rx="4" />
        <rect x="160" y="30" width="110" height="90" fill="#E7DCC8" rx="4" />
        <rect x="310" y="50" width="100" height="80" fill="#E7DCC8" rx="4" />
        <rect x="60" y="180" width="120" height="80" fill="#CDE5C8" rx="4" />
        <rect x="250" y="200" width="140" height="70" fill="#CDE5C8" rx="4" />
        <path
          d="M70 270 C140 240, 200 160, 260 140 S380 110, 420 80"
          fill="none"
          stroke="#0C1833"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="70" cy="270" r="10" fill="#fff" stroke="#0C1833" strokeWidth="3" />
        {segments.map((segment, index) => {
          const x = 160 + index * 90;
          const y = 200 - index * 40;
          return (
            <g key={segment.id}>
              <text x={x} y={y - 18} textAnchor="middle" fontSize="12" fontWeight="700">
                {segment.number}
              </text>
              {segment.status === "amber" ? (
                <path d={`M${x} ${y - 10} L${x + 12} ${y + 12} H${x - 12} Z`} fill="#F59E0B" stroke="#0C1833" />
              ) : segment.status === "red" ? (
                <circle cx={x} cy={y} r="10" fill="#DC2626" stroke="#0C1833" />
              ) : segment.status === "green" ? (
                <rect x={x - 9} y={y - 9} width="18" height="18" fill="#059669" stroke="#0C1833" />
              ) : (
                <path d={`M${x} ${y - 11} L${x + 11} ${y} L${x} ${y + 11} L${x - 11} ${y} Z`} fill="#64748B" stroke="#0C1833" />
              )}
            </g>
          );
        })}
        <rect x="405" y="55" width="22" height="22" fill="#0C1833" rx="2" />
      </svg>
    </div>
  );
}
