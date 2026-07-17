import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";

const LINKS = [
  { href: "/admin/assurance/frameworks", label: "Frameworks" },
  { href: "/admin/assurance/controls", label: "Controls" },
  { href: "/admin/assurance/evidence", label: "Evidence" },
  { href: "/admin/assurance/readiness", label: "Readiness" },
  { href: "/admin/assurance/registration", label: "Registration" },
  { href: "/admin/assurance/ndia-application", label: "NDIA application" },
  { href: "/admin/assurance/go-live", label: "Go-live" },
] as const;

export default async function AssuranceHomePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Assurance readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Feature flags are not readiness. Registration is not approval. MapAble does
        not claim certification from this console.
      </p>
      <nav aria-label="Assurance sections">
        <ul className="list-disc space-y-2 pl-6">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link className="underline" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
