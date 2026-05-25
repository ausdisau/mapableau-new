import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminFoodDisputesPage() {
  await requirePermission("foods:admin");
  const disputes = await prisma.foodDispute.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Open disputes</h1>
      <ul className="mt-4 space-y-2">
        {disputes.map((d) => (
          <li key={d.id} className="rounded border p-3">
            Order {d.orderId.slice(0, 8)} — {d.reason.slice(0, 80)}
          </li>
        ))}
      </ul>
    </div>
  );
}
