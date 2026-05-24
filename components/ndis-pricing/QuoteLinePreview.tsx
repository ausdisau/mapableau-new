"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type QuoteLine = {
  description: string;
  supportItemCode?: string;
  quantity: number;
  unitAmountCents?: number;
  totalAmountCents?: number;
  priceCapCents?: number;
  status: string;
  warnings: Array<{ severity: string; message: string; plainMessage?: string }>;
};

export function QuoteLinePreview({
  initialLines,
  audience = "provider",
}: {
  initialLines?: Array<{
    description: string;
    supportItemCode?: string;
    quantity?: number;
    unitAmountCents?: number;
  }>;
  audience?: "participant" | "provider" | "admin";
}) {
  const [lines, setLines] = useState(
    initialLines ?? [
      { description: "Support session", supportItemCode: "", quantity: 1 },
    ]
  );
  const [results, setResults] = useState<QuoteLine[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const descBase = useId();

  async function calculate() {
    setBusy(true);
    const res = await fetch(
      `/api/ndis-pricing/calculate-quote?audience=${audience}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            description: l.description,
            supportItemCode: l.supportItemCode || undefined,
            quantity: l.quantity ?? 1,
            unitAmountCents: l.unitAmountCents,
          })),
        }),
      }
    );
    const data = await res.json();
    setResults(data.lines ?? []);
    setTotalCents(data.totalCents ?? 0);
    setDisclaimer(data.disclaimer ?? null);
    setBusy(false);
  }

  return (
    <Card className={mapableSectionCardClass}>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Quote preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lines.map((line, i) => (
          <fieldset
            key={`${descBase}-${i}`}
            className="space-y-2 rounded-md border p-3"
          >
            <legend className="px-1 text-sm font-medium">Line {i + 1}</legend>
            <input
              aria-label={`Line ${i + 1} description`}
              value={line.description}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], description: e.target.value };
                setLines(next);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              aria-label={`Line ${i + 1} support item code`}
              value={line.supportItemCode ?? ""}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], supportItemCode: e.target.value };
                setLines(next);
              }}
              placeholder="Support item code"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() =>
            setLines([...lines, { description: "", supportItemCode: "", quantity: 1 }])
          }
        >
          Add line
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void calculate()}
          disabled={busy}
        >
          Calculate quote
        </Button>
        {disclaimer ? (
          <p className="text-xs text-muted-foreground" role="note">
            {disclaimer}
          </p>
        ) : null}
        {results.length > 0 ? (
          <div>
            <p className="text-sm font-medium">
              Estimated total: ${(totalCents / 100).toFixed(2)} AUD
            </p>
            <ul className="mt-2 space-y-2" aria-label="Calculated quote lines">
              {results.map((r) => (
                <li key={`${r.supportItemCode}-${r.description}`} className="text-sm">
                  <span className="font-medium">{r.description}</span>
                  {r.supportItemCode ? (
                    <span className="ml-2 font-mono text-xs">{r.supportItemCode}</span>
                  ) : null}
                  {r.totalAmountCents != null ? (
                    <span className="ml-2">
                      ${(r.totalAmountCents / 100).toFixed(2)}
                    </span>
                  ) : null}
                  {r.status === "review_required" ? (
                    <span className="ml-2 text-amber-700 dark:text-amber-300">
                      Review required
                    </span>
                  ) : null}
                  {r.warnings.map((w) => (
                    <p
                      key={w.message}
                      className="text-xs text-muted-foreground"
                    >
                      {audience === "participant"
                        ? w.plainMessage ?? w.message
                        : w.message}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
