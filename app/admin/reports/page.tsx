import Link from "next/link";

import { ExportSafetyNotice } from "@/components/data-governance/ExportSafetyNotice";
import { requirePermission } from "@/lib/auth/guards";
import { listReportDefinitions } from "@/lib/reports/report-definition-service";

export const metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage() {
  await requirePermission("reporting:manage");
  const definitions = await listReportDefinitions();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Operational and compliance reports with de-identification and low-count suppression.
        </p>
      </header>
      <ExportSafetyNotice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((def) => (
          <Link
            key={def.id}
            href={`/admin/reports/${def.reportKey}`}
            className="rounded-xl border border-border p-4 hover:bg-muted/30"
          >
            <h2 className="font-medium">{def.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {def.category}
              {def.deidentified ? " · de-identified" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
