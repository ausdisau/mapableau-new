import { AbilityPayDashboard } from "@/components/abilitypay/AbilityPayDashboard";
import {
  canApproveInvoice,
  canReviewInvoice,
} from "@/lib/abilitypay/policy";
import { listInvoicesForUser, listPendingApprovals } from "@/lib/abilitypay/invoice-service";
import {
  getPlanWalletSummary,
  listPlansForUser,
} from "@/lib/abilitypay/plan-service";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export default async function AbilityPayHomePage() {
  const user = await requirePermission("abilitypay:read");

  const plans = await listPlansForUser(user.id, user.primaryRole);
  const primaryPlan = plans[0];
  const wallet = primaryPlan
    ? await getPlanWalletSummary(primaryPlan.id)
    : null;

  const recentInvoices = await listInvoicesForUser(user.id, user.primaryRole);
  const pendingApprovals = canApproveInvoice(user)
    ? await listPendingApprovals(user.id)
    : [];

  const showWorkbench =
    canReviewInvoice(user) &&
    hasPermission(user.primaryRole, "abilitypay:invoice:review");

  const workbenchInvoices = showWorkbench
    ? recentInvoices.filter((i) =>
        ["in_review", "awaiting_participant"].includes(i.status)
      )
    : [];

  return (
    <AbilityPayDashboard
      wallet={wallet}
      recentInvoices={recentInvoices}
      pendingApprovalCount={pendingApprovals.length}
      showWorkbench={showWorkbench}
      workbenchInvoices={workbenchInvoices}
    />
  );
}
