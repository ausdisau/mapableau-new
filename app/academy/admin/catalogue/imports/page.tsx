import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCatalogueImportsPage() {
  await requirePermission("academy:admin");
  const runs = await prisma.curriculumImportRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-teal-950">Catalogue imports</h1>
        <p className="text-sm text-slate-600">
          CLI: <code>pnpm academy:catalogue:import --file docs/academy/…xlsx</code> (dry-run
          default; use <code>--apply</code> to mutate).
        </p>
      </header>
      <ul className="space-y-3 text-sm">
        {runs.map((run) => (
          <li key={run.id} className="border-b pb-2">
            <Link
              href={`/academy/admin/catalogue/imports/${run.id}`}
              className="text-teal-800 underline"
            >
              {run.createdAt.toISOString()} — {run.result}
            </Link>
            <p className="text-slate-600">
              {run.sourceFilename} · created {run.createdCount} · updated {run.updatedCount} ·
              unchanged {run.unchangedCount} · rejected {run.rejectedCount}
              {run.dryRun ? " · dry-run" : ""}
            </p>
          </li>
        ))}
      </ul>
      {runs.length === 0 ? (
        <p className="text-slate-600">No applied import runs yet.</p>
      ) : null}
    </article>
  );
}
