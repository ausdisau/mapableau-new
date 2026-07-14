"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";

const LEVELS = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"] as const;

export function CatalogueFilters({
  schools,
}: {
  schools: Array<{ code: string; name: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const formId = useId();
  const liveId = `${formId}-live`;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/academy/catalogue?${next.toString()}`);
  }

  return (
    <form
      className="space-y-3 rounded border border-slate-200 bg-white/80 p-4"
      aria-describedby={liveId}
      onSubmit={(e) => e.preventDefault()}
    >
      <p id={liveId} className="sr-only" aria-live="polite">
        Catalogue filters update the course list when changed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          Search
          <input
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => update("q", e.target.value)}
            name="q"
          />
        </label>
        <label className="block text-sm">
          Academy school
          <select
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("school") ?? ""}
            onChange={(e) => update("school", e.target.value)}
            name="school"
          >
            <option value="">All schools</option>
            {schools.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Level
          <select
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("level") ?? ""}
            onChange={(e) => update("level", e.target.value)}
            name="level"
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Delivery format contains
          <input
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("format") ?? ""}
            onChange={(e) => update("format", e.target.value)}
            name="format"
          />
        </label>
        <label className="block text-sm">
          Clinical review
          <select
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("clinical") ?? ""}
            onChange={(e) => update("clinical", e.target.value)}
            name="clinical"
          >
            <option value="">Any</option>
            <option value="yes">Required</option>
            <option value="no">Not required</option>
          </select>
        </label>
        <label className="block text-sm">
          Practical assessment
          <select
            className="mt-1 w-full min-h-11 rounded border px-3 py-2"
            defaultValue={params.get("practical") ?? ""}
            onChange={(e) => update("practical", e.target.value)}
            name="practical"
          >
            <option value="">Any</option>
            <option value="yes">Required</option>
            <option value="no">Not required</option>
          </select>
        </label>
      </div>
    </form>
  );
}
