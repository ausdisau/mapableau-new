import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { requireAdmin } from "@/lib/auth/guards";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import { listControlsWithComplianceMapping } from "@/lib/platform-assurance";

export const dynamic = "force-dynamic";

export default async function PlatformAssuranceControlsPage() {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const controls = await listControlsWithComplianceMapping();

  return (
    <PlatformAssuranceShell
      title="Registration control catalogue"
      description="Readiness inventory mapped optionally to ComplianceControl codes. Not certification."
      pathname="/admin/platform-assurance/controls"
    >
      <ul className="space-y-2">
        {controls.map((control) => (
          <li key={control.id} className="rounded-lg border p-3">
            <p className="font-medium">
              <span className="font-mono text-sm">{control.code}</span> —{" "}
              {control.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {control.category} · status {control.status} · owner{" "}
              {control.ownerRole ?? "unassigned"}
            </p>
            {control.description ? (
              <p className="mt-1 text-sm">{control.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </PlatformAssuranceShell>
  );
}
