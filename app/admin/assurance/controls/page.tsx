import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listControls } from "@/lib/assurance/controls/control-service";

export default async function AssuranceControlsPage() {
  await requireAdmin();
  const controls = await listControls();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Assurance controls</h1>
      <ul className="space-y-3">
        {controls.map((c) => (
          <li key={c.id} className="border-b py-2">
            <div className="font-medium">
              <Link className="underline" href={`/admin/assurance/controls/${c.id}`}>
                {c.controlCode} — {c.title}
              </Link>
            </div>
            <div className="text-sm">
              {c.framework.name} · status {c.assuranceStatus} · freshness{" "}
              {c.evidenceFreshnessDays}d
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
