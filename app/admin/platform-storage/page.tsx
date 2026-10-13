import { PlatformStorageAdminClient } from "@/components/admin/platform-storage-admin-client";
import { requireAdmin } from "@/lib/auth/guards";

export default async function PlatformStoragePage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Platform storage + cron</h1>
      <p className="text-sm text-slate-600">
        Frontend controls for platform object storage inspection and maintenance runs.
      </p>
      <PlatformStorageAdminClient />
    </div>
  );
}
