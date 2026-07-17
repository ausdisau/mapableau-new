import Link from "next/link";

import { listSnapshotsForAdmin } from "@/lib/accountability/admin-reader";
import { requirePermission } from "@/lib/auth/guards";

const LINKS = [
  { href: "/admin/accountability/metrics", label: "Metrics" },
  { href: "/admin/accountability/publications", label: "Publications" },
  { href: "/admin/accountability/commitments", label: "Commitments" },
  { href: "/admin/accountability/evidence", label: "Evidence" },
  { href: "/admin/accountability/challenges", label: "Challenges" },
  { href: "/admin/accountability/corrections", label: "Corrections" },
  { href: "/admin/accountability/datasets", label: "Datasets" },
  { href: "/admin/accountability/ai-register", label: "AI register" },
  { href: "/admin/accountability/governance", label: "Governance" },
  { href: "/admin/accountability/disclosure-rules", label: "Disclosure rules" },
] as const;

export default async function AdminAccountabilityHomePage() {
  await requirePermission("accountability:prepare_snapshot");
  const snapshots = await listSnapshotsForAdmin(10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Accountability operations</h1>
        <p className="text-sm text-muted-foreground">
          Prepare, review and publish privacy-safe public accountability
          snapshots. Public pages never read operational Care, Transport, Jobs,
          incident or complaint tables.
        </p>
      </header>
      <nav aria-label="Accountability admin sections">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Recent snapshots</h2>
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No snapshots yet.</p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s) => (
              <li key={s.id} className="rounded border border-slate-200 p-3 text-sm">
                <Link
                  href={`/admin/accountability/publications?id=${s.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {s.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {s.status} · {s._count.values} values · {s._count.approvals}{" "}
                  approvals
                  {s.isDemonstration ? " · demonstration" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm">
        <Link href="/accountability" className="text-primary hover:underline">
          View public portal
        </Link>
      </p>
    </div>
  );
}
