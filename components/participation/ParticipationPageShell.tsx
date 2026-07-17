import Link from "next/link";

export interface ParticipationNavItem {
  href: string;
  label: string;
  description: string;
}

export interface ParticipationSummaryRow {
  label: string;
  value: string;
  note: string;
}

export function ParticipationPageShell({
  eyebrow,
  title,
  description,
  navItems = [],
  rows = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  navItems?: ParticipationNavItem[];
  rows?: ParticipationSummaryRow[];
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-black text-slate-950">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {description}
        </p>
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          Participants define what matters. MapAble does not score loneliness,
          infer interests from diagnosis, assume funding eligibility, or share
          private reflections with organisers.
        </p>
      </header>

      {navItems.length > 0 ? (
        <nav aria-label={`${title} sections`}>
          <ul className="grid gap-3 md:grid-cols-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block h-full rounded-2xl border border-slate-200 p-4 text-sm hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="font-bold text-slate-950">{item.label}</span>
                  <span className="mt-2 block text-slate-600">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <section aria-labelledby="participation-summary-heading">
        <h2 id="participation-summary-heading" className="text-lg font-bold">
          Summary
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">
              {title} status summary with text alternatives.
            </caption>
            <thead className="bg-slate-50 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Area
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  State
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Safeguard
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(rows.length > 0 ? rows : DEFAULT_ROWS).map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">{row.value}</td>
                  <td className="px-4 py-3 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const DEFAULT_ROWS: ParticipationSummaryRow[] = [
  {
    label: "Goals",
    value: "Participant-authored",
    note: "Participant wording remains authoritative.",
  },
  {
    label: "Discovery",
    value: "Unranked",
    note: "Sponsored listings are separated and diagnosis is never inferred.",
  },
  {
    label: "Access",
    value: "Freshness-labelled",
    note: "Unknown or stale access is not treated as accessible.",
  },
];
