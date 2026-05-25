import { AlertTriangle, FileText, MessageCircle, Users } from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { DashboardAlertCard } from "@/components/dashboard/DashboardAlertCard";
import { PendingApprovalsCard } from "@/components/dashboard/PendingApprovalsCard";
import { UnreadMessagesCard } from "@/components/dashboard/UnreadMessagesCard";

export function PlanManagerDashboardContent() {
  return (
    <>
      <DashboardActionCard
        href="/plan-manager/invoices"
        title="Invoice inbox"
        icon={FileText}
        priority="high"
      />
      <PendingApprovalsCard
        count={0}
        href="/plan-manager/invoices"
        label="Participant approvals"
      />
      <DashboardAlertCard
        title="Claim validation"
        message="Review warnings before export."
        href="/plan-manager/invoices"
        severity="info"
      />
      <DashboardActionCard
        href="/plan-manager/exceptions"
        title="Exceptions"
        icon={AlertTriangle}
      />
      <DashboardActionCard
        href="/plan-manager/participants"
        title="Participants"
        icon={Users}
      />
      <UnreadMessagesCard count={0} href="/dashboard/messages" />
      <DashboardActionCard
        href="/dashboard/messages"
        title="Messages"
        icon={MessageCircle}
      />
    </>
  );
}
