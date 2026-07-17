import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountabilityEvidencePage() {
  await requirePermission("accountability:view_source_evidence");

  const rows = await prisma.accountabilityEvidenceItem.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Evidence items</h1>
      <ul className="space-y-2">
        {rows.map((e) => (
          <li key={e.id} className="rounded border p-3 text-sm">{e.publicCitationLabel} · {e.accessClassification}</li>
        ))}
      </ul>
    </div>
  );

}
