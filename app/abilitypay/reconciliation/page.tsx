import { PaymentReconciliationTable } from "@/components/abilitypay/PaymentReconciliationTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getReconciliationSummary,
  listPaymentAttemptsForUser,
} from "@/lib/abilitypay/reconciliation-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayReconciliationPage() {
  const user = await requirePermission("abilitypay:audit:read");

  const [attempts, summary] = await Promise.all([
    listPaymentAttemptsForUser(user.id, user.primaryRole),
    getReconciliationSummary(user.primaryRole),
  ]);

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Payment reconciliation</h1>
        <p className="text-muted-foreground">
          Track payment attempts across Stripe, plan export, manual confirmation,
          and NDIA handoff.
        </p>
      </header>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By attempt status</CardTitle>
              <CardDescription>Gateway execution outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Object.entries(summary.byStatus).map(([status, count]) => (
                <p key={status}>
                  {status}: {count}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By adapter</CardTitle>
              <CardDescription>Funding execution paths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Object.entries(summary.byAdapter).map(([adapter, count]) => (
                <p key={adapter}>
                  {adapter}: {count}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <PaymentReconciliationTable
        attempts={attempts.map((row) => ({
          ...row,
          updatedAt: row.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
