import { PlanWalletSummary } from "@/components/abilitypay/PlanWalletSummary";
import {
  getPlanWalletSummary,
  listPlansForUser,
} from "@/lib/abilitypay/plan-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayPlanPage() {
  const user = await requirePermission("abilitypay:read");
  const plans = await listPlansForUser(user.id, user.primaryRole);
  const plan = plans[0];

  if (!plan) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">Your plan</h1>
        <p className="text-muted-foreground">
          No plan set up yet. Ask your plan manager to create one, or contact
          support.
        </p>
      </div>
    );
  }

  const wallet = await getPlanWalletSummary(plan.id);
  if (!wallet) {
    return null;
  }

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your plan</h1>
        <p className="text-muted-foreground">
          Status: {plan.status} · {plan.title}
        </p>
      </header>
      <PlanWalletSummary
        title={wallet.plan.title}
        allocatedCents={wallet.allocatedCents}
        spentCents={wallet.spentCents}
        remainingCents={wallet.remainingCents}
        categories={wallet.plan.categories}
      />
    </div>
  );
}
