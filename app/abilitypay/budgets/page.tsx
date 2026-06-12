import { BudgetCategoryCard } from "@/components/abilitypay/BudgetCategoryCard";
import { BudgetCategoryForm } from "@/components/abilitypay/BudgetCategoryForm";
import {
  listPlansForUser,
} from "@/lib/abilitypay/plan-service";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export default async function AbilityPayBudgetsPage() {
  const user = await requirePermission("abilitypay:read");
  const canManage = hasPermission(user.primaryRole, "abilitypay:plan:manage");
  const plans = await listPlansForUser(user.id, user.primaryRole);
  const plan = plans[0];

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">
          See how much is allocated and spent in each support category.
        </p>
      </header>

      {!plan ? (
        <p className="text-muted-foreground">No plan available.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plan.categories.map((cat) => (
              <BudgetCategoryCard
                key={cat.id}
                name={cat.name}
                description={cat.description}
                allocatedCents={cat.allocatedCents}
                spentCents={cat.spentCents}
              />
            ))}
          </div>
          {canManage ? <BudgetCategoryForm planId={plan.id} /> : null}
        </>
      )}
    </div>
  );
}
