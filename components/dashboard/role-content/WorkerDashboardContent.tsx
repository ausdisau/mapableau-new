import {
  Calendar,
  ClipboardList,
  FileText,
  MessageCircle,
  Play,
} from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { SafetyActionCard } from "@/components/dashboard/SafetyActionCard";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { UnreadMessagesCard } from "@/components/dashboard/UnreadMessagesCard";

export function WorkerDashboardContent() {
  return (
    <>
      <TodayScheduleCard
        items={[]}
        viewAllHref="/worker/today"
        emptyMessage="No shift scheduled for today."
      />
      <DashboardActionCard
        href="/worker/today"
        title="Start or end shift"
        icon={Play}
        priority="high"
      />
      <DashboardActionCard
        href="/worker/shifts"
        title="Service log"
        icon={ClipboardList}
      />
      <UnreadMessagesCard count={0} href="/dashboard/messages" />
      <DashboardActionCard
        href="/worker/notes"
        title="Participant access notes"
        icon={FileText}
      />
      <DashboardActionCard
        href="/worker/shifts"
        title="All shifts"
        icon={Calendar}
      />
      <SafetyActionCard href="/dashboard/incidents/new" />
      <DashboardActionCard
        href="/dashboard/messages"
        title="Messages"
        icon={MessageCircle}
      />
    </>
  );
}
