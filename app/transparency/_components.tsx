import Link from "next/link";
import type { ReactNode } from "react";

export const transparencyLinks = [
  { href: "/transparency/systems", label: "Governed systems register" },
  { href: "/transparency/decisions", label: "Decision notices and aggregates" },
  { href: "/transparency/appeals", label: "Appeals process" },
  { href: "/transparency/incidents", label: "Governance incident aggregates" },
  { href: "/transparency/community-oversight", label: "Community oversight" },
  { href: "/transparency/change-log", label: "Register change log" },
];

export function TransparencyDisclaimer() {
  return (
    <section className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm">
      <h2 className="font-semibold">Publication boundaries</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Register entries are not certification, endorsement or regulatory
          approval.
        </li>
        <li>
          Public pages never publish secrets, prompts, participant data or fraud
          thresholds.
        </li>
        <li>
          People can challenge consequential decisions through notices and
          appeals.
        </li>
        <li>
          Community recommendations are advisory unless a formally approved
          instrument says otherwise.
        </li>
      </ul>
    </section>
  );
}

export function TransparencyNav() {
  return (
    <nav aria-label="Transparency sections">
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {transparencyLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded border p-3 text-sm hover:bg-neutral-50 focus:outline focus:outline-2"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-dashed border-neutral-300 p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
