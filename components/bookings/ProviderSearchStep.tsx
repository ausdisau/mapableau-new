"use client";

import { useEffect, useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";

export type ProviderOption = {
  id: string;
  name: string;
  verificationStatus?: string;
  serviceRegions?: string[];
  organisationType?: string;
};

export function ProviderSearchStep({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/search/providers?q=${encodeURIComponent(query)}&take=20`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed");
        const list =
          data.providers ??
          data.organisations ??
          data.results ??
          [];
        if (!cancelled) {
          setProviders(
            list.map((p: Record<string, unknown>) => ({
              id: String(p.id),
              name: String(p.name ?? p.organisation_name ?? "Provider"),
              verificationStatus: p.verificationStatus as string | undefined,
              serviceRegions: p.serviceRegions as string[] | undefined,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setProviders([]);
          setError("Could not load providers. You can continue without one.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Choose a provider</h2>
      <AccessibleFormField label="Search providers" id="provider-search">
        <input
          id="provider-search"
          className="w-full rounded-md border px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or region"
        />
      </AccessibleFormField>
      {error && (
        <p className="text-sm text-amber-800" role="status">
          {error}
        </p>
      )}
      {loading && <p className="text-sm">Searching…</p>}
      <ul className="space-y-2" role="listbox" aria-label="Providers">
        {providers.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={selectedId === p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full rounded-lg border p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedId === p.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <span className="font-medium">{p.name}</span>
              {p.verificationStatus && (
                <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {p.verificationStatus.replace("_", " ")}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
