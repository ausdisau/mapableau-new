import { requireAdmin } from "@/lib/auth/guards";
import { getNdisReadinessChecklist } from "@/lib/ndis/ndis-readiness-service";

export const metadata = { title: "NDIS readiness | Admin" };

export default async function NdisReadinessPage() {
  await requireAdmin();
  const checklist = await getNdisReadinessChecklist();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIS API readiness</h1>
      <ul className="space-y-3">
        {checklist.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border p-4"
            data-status={item.status}
          >
            <div className="font-medium">{item.label}</div>
            <div className="text-sm text-muted-foreground">{item.detail}</div>
            <div className="mt-1 text-xs uppercase tracking-wide">{item.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
