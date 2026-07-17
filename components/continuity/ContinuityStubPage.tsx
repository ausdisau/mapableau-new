import type { ReactNode } from "react";

export interface ContinuityStubPageProps {
  title: string;
  intro: string;
  disclaimers?: string[];
  children?: ReactNode;
}

const DEFAULT_DISCLAIMERS = [
  "Continuity preserves participant goals — not merely bookings.",
  "AURA cannot call 000 or dispatch emergency services.",
  "External signals may be stale; recovery actions require validation and freshness.",
];

export function ContinuityStubPage({ title, intro, disclaimers, children }: ContinuityStubPageProps) {
  const rendered = disclaimers ?? DEFAULT_DISCLAIMERS;
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{intro}</p>
      </header>
      <section
        aria-label="Important disclaimers"
        className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm"
      >
        <ul className="list-disc space-y-1 pl-5">
          {rendered.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      {children}
    </main>
  );
}
