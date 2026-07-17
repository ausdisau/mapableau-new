import Link from "next/link";

import { ACCOUNTABILITY_DOMAIN_CARDS } from "@/lib/accountability/public-reader";

export function DomainBrowseCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ACCOUNTABILITY_DOMAIN_CARDS.map((card) => (
        <li key={card.href}>
          <Link
            href={card.href}
            className="flex h-full min-h-[7rem] flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
          >
            <span className="font-heading text-lg font-semibold text-primary">
              {card.title}
            </span>
            <span className="mt-2 text-sm text-muted-foreground">
              {card.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
