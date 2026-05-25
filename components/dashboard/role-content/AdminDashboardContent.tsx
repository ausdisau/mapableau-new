import {
  BarChart3,
  LayoutDashboard,
  MessageCircle,
  Shield,
} from "lucide-react";

import { DashboardActionCard } from "@/components/dashboard/DashboardActionCard";

export function AdminDashboardContent() {
  return (
    <>
      <DashboardActionCard
        href="/admin"
        title="Platform dashboard"
        icon={LayoutDashboard}
        priority="high"
      />
      <DashboardActionCard
        href="/admin/provider-quality"
        title="Quality"
        icon={Shield}
      />
      <DashboardActionCard
        href="/admin/support"
        title="Support desk"
        icon={MessageCircle}
      />
      <DashboardActionCard
        href="/admin/reports"
        title="Reports"
        icon={BarChart3}
      />
    </>
  );
}
