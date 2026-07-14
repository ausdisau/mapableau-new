import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ runId: string }> };

export default async function AdminCatalogueImportRunPage({ params }: Props) {
  await requirePermission("academy:admin");
  const { runId } = await params;
  const run = await prisma.curriculumImportRun.findUnique({
    where: { id: runId },
    include: { issues: { orderBy: { createdAt: "asc" } } },
  });
  if (!run) notFound();

  return (
    <article className="space-y-6">
      <nav className="text-sm">
        <Link href="/academy/admin/catalogue/imports" className="text-teal-800 underline">
          Imports
        </Link>
      </nav>
      <h1 className="font-heading text-3xl font-bold text-teal-950">Import run</h1>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Filename</dt>
          <dd>{run.sourceFilename}</dd>
        </div>
        <div>
          <dt className="font-medium">Checksum</dt>
          <dd className="font-mono text-xs break-all">{run.sourceChecksum}</dd>
        </div>
        <div>
          <dt className="font-medium">Result</dt>
          <dd>{run.result}</dd>
        </div>
        <div>
          <dt className="font-medium">Counts</dt>
          <dd>
            +{run.createdCount} / ~{run.updatedCount} / ={run.unchangedCount} / !{run.rejectedCount}
          </dd>
        </div>
      </dl>
      <section aria-labelledby="issues-heading">
        <h2 id="issues-heading" className="text-lg font-semibold">
          Issues ({run.issues.length})
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {run.issues.map((i) => (
            <li key={i.id}>
              [{i.severity}] {i.courseCode ?? ""} {i.field ?? ""} — {i.message}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
