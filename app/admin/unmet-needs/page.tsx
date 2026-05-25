import { UnmetNeedAdminDashboard } from "@/components/unmet-needs/UnmetNeedAdminDashboard";
import { ServiceGapSummary } from "@/components/unmet-needs/ServiceGapSummary";

export default function AdminUnmetNeedsPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold">Unmet needs register</h1>
      <ServiceGapSummary />
      <UnmetNeedAdminDashboard />
    </div>
  );
}
