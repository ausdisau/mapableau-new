import { listCorrectionsForAdmin } from "@/lib/accountability/admin-reader";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminAccountabilityCorrectionsPage() {
  await requirePermission("accountability:issue_correction");

  const rows = await listCorrectionsForAdmin();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Corrections</h1>
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className="rounded border p-3 text-sm">{c.title} · {c.status}</li>
        ))}
      </ul>
    </div>
  );

}
