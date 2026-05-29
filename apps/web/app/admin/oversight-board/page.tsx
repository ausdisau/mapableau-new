import { requireAdmin } from "@/lib/auth/guards";
import { getOversightPortalSummary } from "@/lib/oversight-board/oversight-service";

export default async function OversightBoardAdminPage() {
  await requireAdmin();
  const data = await getOversightPortalSummary();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Oversight board</h1>
      <p className="text-sm">{data.meetings?.length ?? 0} meetings</p>
      <ul className="space-y-2">
        {(data.decisions ?? []).map((d) => (
          <li key={d.id} className="rounded border p-3 text-sm">
            {d.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
