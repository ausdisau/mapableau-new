import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { FoodSafetyIssueReport } from "@/components/foods/FoodSafetyIssueReport";

export default async function AdminFoodSafetyPage() {
  await requirePermission("foods:admin");
  const events = await prisma.foodSafetyEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Food safety</h1>
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="rounded border p-3 text-sm">
            {e.severity} — {e.description.slice(0, 120)} — {e.status}
          </li>
        ))}
      </ul>
      <FoodSafetyIssueReport />
    </div>
  );
}
