import Link from "next/link";

const LINKS = [
  { href: "/academy/provider/learners", label: "Learners" },
  { href: "/academy/provider/groups", label: "Groups" },
  { href: "/academy/provider/assignments", label: "Assignments" },
  { href: "/academy/provider/compliance", label: "Compliance" },
  { href: "/academy/provider/expiries", label: "Expiries" },
  { href: "/academy/provider/policies", label: "Policies" },
  { href: "/academy/provider/reports", label: "Reports" },
] as const;

export default function AcademyProviderHomePage() {
  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Provider academy</h1>
      <p className="text-slate-700">
        Assign courses, monitor completions, and export workforce learning records for
        your organisation. Records support capability analysis — they do not guarantee
        NDIS compliance.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded border border-slate-200 bg-white/80 px-4 py-3 text-teal-900 hover:border-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
