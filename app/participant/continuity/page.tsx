import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/participant/continuity/profile", label: "My continuity profile" },
  { href: "/participant/continuity/life-events", label: "My life events" },
  { href: "/participant/continuity/cases", label: "Continuity cases" },
  { href: "/participant/continuity/options", label: "Recovery options" },
  { href: "/participant/continuity/standing-instructions", label: "Standing instructions" },
  { href: "/participant/continuity/history", label: "Continuity history" },
  { href: "/participant/continuity/outcomes", label: "Outcomes" },
];

export default async function ParticipantContinuityPage() {
  await requireAuth();
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Your continuity</h1>
        <p className="text-sm text-muted-foreground">
          Continuity keeps your services working around your goals — not just your bookings.
        </p>
      </header>

      <section
        aria-label="What we do and do not do"
        className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm"
      >
        <ul className="list-disc space-y-1 pl-5">
          <li>We preserve your goals, not just your bookings.</li>
          <li>We never call 000 or dispatch emergency services — a human safety officer handles emergencies.</li>
          <li>Signals we receive from other systems may be stale; we tell you the freshness before we act.</li>
          <li>We never cancel one booking just because another was cancelled — you decide.</li>
          <li>We never approve invoices, claims, or payments.</li>
        </ul>
      </section>

      <nav aria-label="Continuity sections">
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block rounded border p-3 text-sm hover:bg-neutral-50 focus:outline focus:outline-2"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
