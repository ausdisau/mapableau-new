import { redirect } from "next/navigation";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kitchen orders | Provider" };

export default async function ProviderFoodOrdersPage() {
  const user = await requireAuth();
  if (user.primaryRole !== "provider_admin" && !isAdminRole(user.primaryRole)) {
    redirect("/dashboard");
  }
  const orders = await prisma.foodOrder.findMany({
    where: {
      status: {
        in: ["submitted", "scheduled", "in_delivery", "allergy_pending"],
      },
    },
    include: {
      participant: { select: { name: true, email: true } },
      items: { include: { menuItem: true } },
      safetyEvents: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Partner kitchen orders</h1>
      <p className="text-muted-foreground">
        HACCP and allergy-pending orders appear first for review.
      </p>
      {orders.length === 0 ? (
        <p role="status">No active orders.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">
                  {o.participant.name ?? o.participant.email}
                </span>
                <StatusTextBadge status={o.status} />
              </div>
              <ul className="mt-2 text-sm">
                {o.items.map((line) => (
                  <li key={line.id}>
                    {line.quantity}× {line.menuItem.name}
                  </li>
                ))}
              </ul>
              {o.safetyEvents.length > 0 ? (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Safety: {o.safetyEvents[0].description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
