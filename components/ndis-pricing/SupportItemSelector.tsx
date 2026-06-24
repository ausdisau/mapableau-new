"use client";

import { useCallback, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type Match = {
  code: string;
  name: string;
  score: number;
  confidence: string;
  reasons: string[];
  warnings: Array<{ message: string }>;
};

export function SupportItemSelector({
  onSelect,
  defaultServiceType,
  defaultProviderType,
}: {
  onSelect?: (code: string, name: string) => void;
  defaultServiceType?: string;
  defaultProviderType?: string;
}) {
  const descId = useId();
  const serviceId = useId();
  const providerId = useId();
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState(defaultServiceType ?? "");
  const [providerType, setProviderType] = useState(defaultProviderType ?? "");
  const [matches, setMatches] = useState<Match[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runMatch = useCallback(async () => {
    setBusy(true);
    const res = await fetch("/api/ndis-pricing/match-support-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        serviceType: serviceType || undefined,
        providerType: providerType || undefined,
        limit: 8,
      }),
    });
    const data = await res.json();
    setMatches(data.matches ?? []);
    setDisclaimer(data.disclaimer ?? null);
    setBusy(false);
  }, [description, serviceType, providerType]);

  return (
    <Card className={mapableSectionCardClass}>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Support item selector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Match by service type, provider type, and description. Suggestions are not
          NDIA approvals.
        </p>
        <div>
          <label htmlFor={descId} className="text-sm font-medium">
            Service description
          </label>
          <textarea
            id={descId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={serviceId} className="text-sm font-medium">
              Service type
            </label>
            <input
              id={serviceId}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. personal_care"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={providerId} className="text-sm font-medium">
              Provider type
            </label>
            <input
              id={providerId}
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              placeholder="e.g. registered_provider"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void runMatch()}
          disabled={busy}
        >
          Find matches
        </Button>
        {disclaimer ? (
          <p className="text-xs text-muted-foreground" role="note">
            {disclaimer}
          </p>
        ) : null}
        <ul className="space-y-2" aria-label="Suggested support items">
          {matches.map((m) => (
            <li
              key={m.code}
              className="rounded-md border p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-medium">{m.code}</span>
                  <span className="ml-2 text-muted-foreground">
                    {m.confidence} confidence ({m.score})
                  </span>
                  <p>{m.name}</p>
                  <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                    {m.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  {m.warnings.map((w) => (
                    <p
                      key={w.message}
                      className="mt-1 text-xs text-amber-700 dark:text-amber-300"
                    >
                      {w.message}
                    </p>
                  ))}
                </div>
                {onSelect ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(m.code, m.name)}
                  >
                    Use item
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
