import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { requireAdmin } from "@/lib/auth/guards";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import { buildAuditReadinessExport } from "@/lib/platform-assurance";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScopeExportPage({ params }: PageProps) {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const { id } = await params;
  let pack: Awaited<ReturnType<typeof buildAuditReadinessExport>>;
  try {
    pack = await buildAuditReadinessExport(id);
  } catch {
    redirect("/admin/platform-assurance/scope");
  }

  return (
    <PlatformAssuranceShell
      title="Audit readiness export"
      description="Internal evidence pack for human review. Not a registration certificate."
      pathname="/admin/platform-assurance/scope"
    >
      <pre
        className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed"
        tabIndex={0}
      >
        {JSON.stringify(pack, null, 2)}
      </pre>
    </PlatformAssuranceShell>
  );
}
