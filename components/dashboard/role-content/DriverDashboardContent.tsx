import { Map, MessageCircle, Shield, Truck } from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";
import { SafetyActionCard } from "@/components/dashboard/SafetyActionCard";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";

export function DriverDashboardContent() {
  return (
    <>
      <TodayScheduleCard
        items={[]}
        viewAllHref="/driver/trips"
        emptyMessage="No trips assigned yet."
      />
      <DashboardActionCard
        href="/driver/trips"
        title="Next trip"
        icon={Truck}
        priority="high"
      />
      <DashboardActionCard
        href="/map"
        title="Pickup map"
        icon={Map}
      />
      <DashboardActionCard
        href="/driver/safety"
        title="Safe loading checklist"
        icon={Shield}
      />
      <DashboardActionCard
        href="/dashboard/messages"
        title="Message participant or provider"
        icon={MessageCircle}
      />
      <SafetyActionCard href="/dashboard/incidents/new" />
    </>
  );
}
