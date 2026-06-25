import React from "react";

export type ConsentItem = {
  id: string;
  label: string;
  description?: string;
  granted: boolean;
  sensitive?: boolean;
};

export type ConsentSummaryProps = {
  title?: string;
  items: ConsentItem[];
};

export function ConsentSummary({
  title = "What you have agreed to share",
  items,
}: ConsentSummaryProps) {
  return (
    <section aria-labelledby="consent-summary-heading" className="rounded-xl border border-border bg-card p-4">
      <h3 id="consent-summary-heading" className="text-base font-bold text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 text-sm">
            <span
              className="mt-0.5 font-bold"
              aria-label={item.granted ? "Granted" : "Not granted"}
            >
              {item.granted ? "✓" : "—"}
            </span>
            <div>
              <p className="font-medium text-foreground">
                {item.label}
                {item.sensitive ? (
                  <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                    Sensitive
                  </span>
                ) : null}
              </p>
              {item.description ? (
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
