import Link from "next/link";

import { listAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssuranceFrameworksPage() {
  await requireAdmin();
  const frameworks = await listAssuranceFrameworks();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Assurance frameworks</h1>
      <p className="text-sm text-muted-foreground">
        Internal readiness catalogues — not copyrighted standards text and not certification.
      </p>
      {frameworks.length === 0 ? (
        <p>No frameworks seeded yet. Use the admin API POST /api/admin/assurance/frameworks.</p>
      ) : (
        <ul className="space-y-4">
          {frameworks.map((fw) => (
            <li key={fw.id} className="rounded-lg border p-4">
              <h2 className="font-semibold">
                <Link className="underline" href={`/admin/assurance/frameworks/${fw.id}`}>
                  {fw.name}
                </Link>
              </h2>
              <p className="text-sm">
                {fw.kind} · v{fw.version} · {fw.controls.length} controls
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
