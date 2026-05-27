import { DataAccessLogTable } from "@/components/admin/DataAccessLogTable";
import { requirePermission } from "@/lib/auth/guards";
import { listDataAccessLogs } from "@/lib/audit/data-access-log-service";

export const metadata = { title: "Data access logs | Admin" };

export default async function AdminDataAccessLogsPage() {
  await requirePermission("data_access:read:any");

  const logs = await listDataAccessLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Data access logs</h1>
        <p className="mt-1 text-muted-foreground">
          Sensitive read access across the platform. Append-only records.
        </p>
      </header>
      <DataAccessLogTable logs={logs} />
    </div>
  );
}
