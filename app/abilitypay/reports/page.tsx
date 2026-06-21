import { format } from "date-fns";

import { MonthlyStatementGenerator } from "@/components/abilitypay/MonthlyStatementGenerator";
import { listPlansForUser } from "@/lib/abilitypay/plan-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayReportsPage() {
  const user = await requirePermission("abilitypay:export");
  const plans = await listPlansForUser(user.id, user.primaryRole);
  const plan = plans[0];

  if (!plan) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Set up a plan before exporting reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Download statements and claim packs for your records.
        </p>
      </header>
      <MonthlyStatementGenerator
        planId={plan.id}
        defaultMonth={format(new Date(), "yyyy-MM")}
      />
    </div>
  );
}
