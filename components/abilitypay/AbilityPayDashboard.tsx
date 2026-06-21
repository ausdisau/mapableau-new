import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { InvoiceInbox } from "./InvoiceInbox";
import { PlanManagerWorkbench } from "./PlanManagerWorkbench";
import { PlanWalletSummary } from "./PlanWalletSummary";
import { SpendingForecastPanel } from "./SpendingForecastPanel";

type DashboardProps = {
  wallet: {
    plan: { id: string; title: string; categories: { id: string; name: string; allocatedCents: number; spentCents: number }[] };
    allocatedCents: number;
    spentCents: number;
    remainingCents: number;
  } | null;
  recentInvoices: Parameters<typeof InvoiceInbox>[0]["invoices"];
  pendingApprovalCount: number;
  showWorkbench: boolean;
  workbenchInvoices: Parameters<typeof PlanManagerWorkbench>[0]["invoices"];
};

export function AbilityPayDashboard({
  wallet,
  recentInvoices,
  pendingApprovalCount,
  showWorkbench,
  workbenchInvoices,
}: DashboardProps) {
  const monthsRemaining = 6;

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">AbilityPay</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your NDIS plan budgets and approve invoices in plain language.
        </p>
      </header>

      {pendingApprovalCount > 0 ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              {pendingApprovalCount} invoice
              {pendingApprovalCount === 1 ? "" : "s"} need your approval
            </CardTitle>
            <CardDescription>
              Review and approve before they can be exported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" size="default" className="min-h-11">
              <Link href="/abilitypay/approvals">Go to approvals</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {wallet ? (
        <>
          <PlanWalletSummary
            title={wallet.plan.title}
            allocatedCents={wallet.allocatedCents}
            spentCents={wallet.spentCents}
            remainingCents={wallet.remainingCents}
            categories={wallet.plan.categories}
          />
          <SpendingForecastPanel
            remainingCents={wallet.remainingCents}
            monthsRemaining={monthsRemaining}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create a plan and add budget categories to track your supports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="default" className="min-h-11">
              <Link href="/abilitypay/plan">Set up your plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {showWorkbench ? (
        <PlanManagerWorkbench invoices={workbenchInvoices} />
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent invoices</h2>
        <InvoiceInbox invoices={recentInvoices.slice(0, 5)} />
        <Link
          href="/abilitypay/invoices"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all invoices
        </Link>
      </section>
    </div>
  );
}
