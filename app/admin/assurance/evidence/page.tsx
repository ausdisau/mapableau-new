import Link from "next/link";

import { listAssuranceEvidence } from "@/lib/assurance/evidence/evidence-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssuranceEvidencePage() {
  await requireAdmin();
  const evidence = await listAssuranceEvidence({ currentOnly: true });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Assurance evidence</h1>
      <p className="text-sm">Current evidence only. Restricted items are not exported.</p>
      <ul className="space-y-3">
        {evidence.map((e) => (
          <li key={e.id} className="border-b py-2">
            <div className="font-medium">{e.title}</div>
            <div className="text-sm">
              {e.control.controlCode} · {e.evidenceType} · {e.classification}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
