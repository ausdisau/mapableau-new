"use client";

import { useCallback, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type ItemSummary = {
  id: string;
  code: string;
  name: string;
  categoryLabel?: string | null;
  priceCapCents?: number | null;
  unitType?: string | null;
};

export function SupportItemLookup({
  onSelect,
}: {
  onSelect?: (item: ItemSummary) => void;
}) {
  const searchId = useId();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const params = new URLSearchParams({ limit: "20" });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/ndis-pricing/support-items?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Search failed");
      setItems([]);
    } else {
      setItems(data.items ?? []);
      setMessage(data.disclaimer ?? null);
    }
    setBusy(false);
  }, [q]);

  return (
    <Card className={mapableSectionCardClass}>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Support item lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[200px] flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search support items
            </label>
            <input
              id={searchId}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void search();
              }}
              placeholder="Code or name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => void search()}
            disabled={busy}
          >
            Search
          </Button>
        </div>
        {message ? (
          <p className="text-xs text-muted-foreground" role="note">
            {message}
          </p>
        ) : null}
        <ul className="divide-y rounded-md border" aria-label="Support item results">
          {items.length === 0 ? (
            <li className="p-3 text-sm text-muted-foreground">No items yet.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <span className="font-mono text-sm font-medium">{item.code}</span>
                  <p className="text-sm">{item.name}</p>
                  {item.priceCapCents != null ? (
                    <p className="text-xs text-muted-foreground">
                      Cap: ${(item.priceCapCents / 100).toFixed(2)}
                      {item.unitType ? ` / ${item.unitType}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      No catalogue price on file
                    </p>
                  )}
                </div>
                {onSelect ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(item)}
                  >
                    Select
                  </Button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
