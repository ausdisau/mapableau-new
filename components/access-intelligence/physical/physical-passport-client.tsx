"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Passport = {
  id: string;
  name: string;
  isDefault: boolean;
  mobilityAids: string[];
  requirements: Array<{
    id: string;
    featureType: string;
    importance: string;
    operator: string;
    value: unknown;
    unit?: string | null;
  }>;
};

export function PhysicalPassportClient() {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [selected, setSelected] = useState<string>("passport-power-chair");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/access-intelligence/physical/passports");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load passports");
        setPassports(data.passports ?? []);
        const def =
          data.passports?.find((p: Passport) => p.isDefault)?.id ??
          data.passports?.[0]?.id;
        if (def) setSelected(def);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, []);

  const active = passports.find((p) => p.id === selected);

  return (
    <AccessIntelligenceShell
      title="Physical Systems · Passport"
      description="Select a named Access Passport for Harbour visit planning. Preferences are functional requirements — never diagnoses."
    >
      <FictionalBanner />
      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold" htmlFor="phys-passport">
        Active passport
      </label>
      <select
        id="phys-passport"
        className={`mt-2 min-h-11 w-full max-w-xl rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {passports.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>
      {active ? (
        <section className="mt-6" aria-labelledby="req-heading">
          <h2 id="req-heading" className="text-xl font-black">
            Requirements
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Mobility aids: {active.mobilityAids.join(", ") || "none listed"}
          </p>
          <ul className="mt-4 space-y-2">
            {active.requirements.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{r.featureType}</span>
                {" · "}
                {r.importance} · {r.operator}{" "}
                {String(r.value)}
                {r.unit ? ` ${r.unit}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="default" size="default">
          <Link href={`/access-intelligence/physical/plan?passportId=${selected}`}>
            Plan Harbour visit
          </Link>
        </Button>
        <Button asChild variant="outline" size="default">
          <Link href="/access-intelligence/passport">Full passport editor</Link>
        </Button>
      </div>
    </AccessIntelligenceShell>
  );
}
