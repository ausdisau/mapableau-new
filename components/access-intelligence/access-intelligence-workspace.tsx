"use client";

import React, { useEffect, useState } from "react";

import { AccessChat } from "@/components/access-intelligence/access-chat";
import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { PlaceResultCard } from "@/components/access-intelligence/evidence-list";
import type { AccessPassport } from "@/lib/access-intelligence/schemas";

export function AccessIntelligenceWorkspace() {
  const [passports, setPassports] = useState<AccessPassport[]>([]);
  const [selectedPassportId, setSelectedPassportId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/access-intelligence/passport");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load passports");
        const list = (data.passports ?? []) as AccessPassport[];
        setPassports(list);
        const def = list.find((p) => p.isDefault) ?? list[0];
        if (def) setSelectedPassportId(def.id);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Could not load passports");
      }
    })();
  }, []);

  return (
    <AccessIntelligenceShell
      title="Plan whether a place works for you"
      description="Use your Access Passport, building evidence, and live conditions to decide if you can reach, enter, move through, and use a destination — with blockers, unknowns, and confidence stated clearly."
    >
      {loadError ? (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm" role="alert">
          {loadError}
        </p>
      ) : null}

      {selectedPassportId ? (
        <AccessChat
          passports={passports}
          selectedPassportId={selectedPassportId}
          onPassportChange={setSelectedPassportId}
        />
      ) : (
        <p role="status">Loading Access Passports…</p>
      )}

      <section aria-labelledby="demo-places-heading" className="mt-10 space-y-3">
        <h2 id="demo-places-heading" className="text-2xl font-black">
          Demo places
        </h2>
        <p className="text-sm text-slate-600">
          Synthetic demo data only — measurements do not represent real venues.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <PlaceResultCard
            name="Harbour Civic Centre"
            address="100 Synthetic Quay, Demo Harbour NSW 2000"
            reason="Step-free Entrance B, lift to level 3, Room 3.12"
            href="/access-intelligence/places/place-harbour-civic"
          />
          <PlaceResultCard
            name="Riverside Community Hall"
            address="12 Synthetic River Rd, Demo Bend NSW 2100"
            reason="Meaningful unknowns (outdated toilet, venue-attested hearing loop)"
            href="/access-intelligence/places/place-riverside-hall"
          />
          <PlaceResultCard
            name="Northside Library"
            address="5 Synthetic Library Lane, Demo North NSW 2060"
            reason="Main lift outage with alternative service lift route"
            href="/access-intelligence/places/place-northside-library"
          />
        </div>
      </section>
    </AccessIntelligenceShell>
  );
}
