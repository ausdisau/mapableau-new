import Link from "next/link";
import { notFound } from "next/navigation";

import { getAssuranceFramework } from "@/lib/assurance/frameworks/framework-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssuranceFrameworkDetailPage({
  params,
}: {
  params: Promise<{ frameworkId: string }>;
}) {
  await requireAdmin();
  const { frameworkId } = await params;
  const framework = await getAssuranceFramework(frameworkId);
  if (!framework) notFound();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance/frameworks">
          Back to frameworks
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">{framework.name}</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Internal readiness catalogue — not copyrighted standards text and not
        certification.
      </p>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Kind</dt>
          <dd>{framework.kind}</dd>
        </div>
        <div>
          <dt className="font-medium">Version</dt>
          <dd>{framework.version}</dd>
        </div>
        <div>
          <dt className="font-medium">Scope</dt>
          <dd>{framework.scopeStatement ?? "—"}</dd>
        </div>
      </dl>

      <section aria-labelledby="controls-heading">
        <h2 id="controls-heading" className="font-heading text-lg font-semibold">
          Controls ({framework.controls.length})
        </h2>
        <ul className="space-y-3">
          {framework.controls.map((control) => (
            <li key={control.id} className="rounded-lg border p-4">
              <Link
                className="font-medium underline"
                href={`/admin/assurance/controls/${control.id}`}
              >
                {control.controlCode} — {control.title}
              </Link>
              <div className="text-sm">
                Status {control.assuranceStatus} · {control.assuranceEvidence.length}{" "}
                current evidence · {control.tests.length} tests ·{" "}
                {control.exceptions.length} approved exceptions
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
