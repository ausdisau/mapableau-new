import { WorkerScreeningQueryPanel } from "@/components/admin/WorkerScreeningQueryPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { listWorkerScreeningPathways } from "@/lib/workforce/screening/pathways";

export default async function WorkerScreeningAdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Worker screening query
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Review worker-screening evidence and route unresolved checks to the
          correct State or Territory Worker Screening Unit. This tool never
          infers worker clearance from provider registration or from the absence
          of public compliance or enforcement records.
        </p>
      </div>

      <WorkerScreeningQueryPanel pathways={listWorkerScreeningPathways()} />
    </div>
  );
}
