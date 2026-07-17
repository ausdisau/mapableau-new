import Link from "next/link";

export interface AccessOpsPageShellProps {
  title: string;
  description: string;
  navItems?: { href: string; label: string; description: string }[];
  rows?: { label: string; value: string; note: string }[];
  admin?: boolean;
}

export function AccessOpsPageShell({
  title,
  description,
  navItems = [],
  rows = [],
  admin = false,
}: AccessOpsPageShellProps) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          {admin ? "AccessOps command centre" : "Civic operator portal"}
        </p>
        <h1 className="text-3xl font-black text-slate-950">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {description}
        </p>
        <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
          Operators only see authorised assets. AccessOps does not show
          individual participant journeys, and stale or missing data is never
          presented as current access.
        </p>
      </header>

      {navItems.length > 0 ? (
        <nav aria-label={`${title} sections`}>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block h-full rounded-2xl border border-slate-200 p-4 text-sm hover:border-sky-300 hover:bg-sky-50"
                >
                  <span className="font-bold text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-2 block text-slate-600">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <section aria-labelledby="accessops-summary-heading">
        <h2 id="accessops-summary-heading" className="text-lg font-bold">
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
                  Text alternative
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

const DEFAULT_ROWS = [
  {
    label: "Authorised assets",
    value: "Requires signed-in operator",
    note: "Restricted geometry and participant routes are not displayed.",
  },
  {
    label: "Operational status",
    value: "Freshness checked",
    note: "Stale status is labelled stale rather than current.",
  },
  {
    label: "Reliability",
    value: "Feature-level",
    note: "No universal access score is calculated.",
  },
];
