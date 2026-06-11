import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AbilityPayAdminPage() {
  await requirePermission("abilitypay:admin");

  const [planCount, invoiceCount, riskCount] = await Promise.all([
    prisma.abilityPayParticipantPlan.count(),
    prisma.abilityPayInvoice.count(),
    prisma.abilityPayRiskFlag.count({ where: { resolved: false } }),
  ]);

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">AbilityPay admin</h1>
        <p className="text-muted-foreground">
          Module overview and risk flag review. No NDIA submission tools.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plans</CardTitle>
            <CardDescription>Participant plans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{planCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
            <CardDescription>All invoice records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{invoiceCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open risk flags</CardTitle>
            <CardDescription>Unresolved validation flags</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{riskCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
