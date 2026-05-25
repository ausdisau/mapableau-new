"use client";

import { useEffect, useState } from "react";

type Therapist = {
  id: string;
  displayName: string;
  profileSummary: string | null;
  therapyTypes: string[];
  telehealthEnabled: boolean;
  homeVisitEnabled: boolean;
};

type TherapistSearchProps = {
  onSelect: (id: string) => void;
  selectedId?: string;
};

export function TherapistSearch({ onSelect, selectedId }: TherapistSearchProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/moves/therapists")
      .then((r) => r.json())
      .then((d) => setTherapists(d.therapists ?? []));
  }, []);

  const filtered = therapists.filter(
    (t) =>
      !filter ||
      t.displayName.toLowerCase().includes(filter.toLowerCase()) ||
      t.therapyTypes.some((ty) => ty.includes(filter)),
  );

  return (
    <div className="space-y-3">
      <label htmlFor="therapist-filter" className="block text-sm font-medium">
        Search verified therapists
      </label>
      <input
        id="therapist-filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-md min-h-10 rounded-lg border border-border px-3"
        placeholder="Name or therapy type"
      />
      <ul className="space-y-2">
        {filtered.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className={`w-full rounded-xl border p-4 text-left focus-visible:ring-2 focus-visible:ring-ring ${
                selectedId === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <span className="font-medium">{t.displayName}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.therapyTypes.join(", ").replace(/_/g, " ")}
              </p>
              {t.profileSummary ? (
                <p className="mt-1 text-sm">{t.profileSummary}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
