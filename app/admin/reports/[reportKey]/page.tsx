import { ExportSafetyNotice } from "@/components/data-governance/ExportSafetyNotice";
import { ReportRunActions } from "@/components/reports/ReportRunActions";
import { requirePermission } from "@/lib/auth/guards";
import { getReportDefinitionByKey } from "@/lib/reports/report-definition-service";
import { listReportRuns } from "@/lib/reports/report-runner-service";
import { notFound } from "next/navigation";

export const metadata = { title: "Report | Admin" };

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportKey: string }>;
}) {
  await requirePermission("reporting:manage");
  const { reportKey } = await params;

  const definition = await getReportDefinitionByKey(reportKey);
  if (!definition) notFound();

  const runs = await listReportRuns({ reportKey, limit: 10 });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">{definition.title}</h1>
        <p className="mt-1 text-muted-foreground">{definition.description}</p>
      </header>
      <ExportSafetyNotice />
      <ReportRunActions reportKey={reportKey} canExport />
      <section>
        <h2 className="font-heading text-lg font-semibold">Recent runs</h2>
        <ul className="mt-4 space-y-2">
          {runs.length === 0 ? (
            <li className="text-sm text-muted-foreground">No runs yet.</li>
          ) : (
            runs.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-sm"
              >
                <span>
                  {run.status} · {new Date(run.createdAt).toLocaleString("en-AU")}
                </span>
                <span className="text-muted-foreground">{run.actorUser?.name}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
