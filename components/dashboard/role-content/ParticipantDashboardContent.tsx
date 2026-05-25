import {
  Bus,
  Calendar,
  FileCheck,
  Headphones,
  MessageCircle,
  Search,
  Shield,
} from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { PendingApprovalsCard } from "@/components/dashboard/PendingApprovalsCard";
import { SafetyActionCard } from "@/components/dashboard/SafetyActionCard";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { UnreadMessagesCard } from "@/components/dashboard/UnreadMessagesCard";

export function ParticipantDashboardContent() {
  return (
    <>
      <TodayScheduleCard items={[]} viewAllHref="/dashboard/bookings" />
      <UnreadMessagesCard count={0} href="/dashboard/messages" />
      <PendingApprovalsCard count={0} href="/dashboard/invoices" label="Invoices to review" />
      <DashboardActionCard
        href="/provider-finder"
        title="Find a provider"
        description="Search by location and support type"
        icon={Search}
        priority="high"
      />
      <DashboardActionCard
        href="/dashboard/transport/new"
        title="Book transport"
        icon={Bus}
      />
      <DashboardActionCard
        href="/dashboard/bookings"
        title="My bookings"
        icon={Calendar}
      />
      <DashboardActionCard
        href="/dashboard/invoices"
        title="Approve invoice"
        icon={FileCheck}
      />
      <DashboardActionCard
        href="/dashboard/support"
        title="Support desk"
        icon={Headphones}
      />
      <DashboardActionCard
        href="/dashboard/consent"
        title="Consent alerts"
        icon={Shield}
      />
      <DashboardActionCard
        href="/dashboard/messages"
        title="Messages"
        icon={MessageCircle}
      />
      <SafetyActionCard href="/dashboard/incidents/new" />
    </>
  );
}
