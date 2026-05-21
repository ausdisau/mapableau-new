import { AtRiskReasonPanel } from "@/components/phase3/AtRiskReasonPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { getAtRiskItems } from "@/lib/admin/service-ops";

export default async function AtRiskPage() {
  await requireAdmin();
  const items = await getAtRiskItems();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">At-risk service items</h1>
      <AtRiskReasonPanel items={items} />
    </div>
  );
}
