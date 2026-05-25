import {
  Calendar,
  ClipboardList,
  FileText,
  MessageCircle,
  Shield,
  Users,
} from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { UnreadMessagesCard } from "@/components/dashboard/UnreadMessagesCard";

export function ProviderDashboardContent() {
  return (
    <>
      <DashboardActionCard
        href="/provider/bookings"
        title="Booking requests"
        icon={ClipboardList}
        priority="high"
      />
      <TodayScheduleCard
        items={[]}
        viewAllHref="/provider/care/shifts"
        emptyMessage="No shifts on today's roster yet."
      />
      <UnreadMessagesCard count={0} href="/provider/messages" />
      <DashboardActionCard
        href="/provider/care/shifts"
        title="Today's roster"
        icon={Calendar}
      />
      <DashboardActionCard
        href="/provider/invoices"
        title="Invoices"
        icon={FileText}
      />
      <DashboardActionCard
        href="/provider/workers"
        title="Worker expiries"
        icon={Users}
      />
      <DashboardActionCard
        href="/admin/provider-quality"
        title="Quality actions"
        icon={Shield}
      />
      <DashboardActionCard
        href="/provider/capacity"
        title="Capacity and waitlist"
        icon={Users}
      />
      <DashboardActionCard
        href="/provider/messages"
        title="Messages"
        icon={MessageCircle}
      />
    </>
  );
}
