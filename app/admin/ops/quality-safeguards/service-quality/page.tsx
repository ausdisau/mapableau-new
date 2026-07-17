import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Service quality | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Service quality"
      description="Care and transport quality signals for human triage."
      breadcrumbExtra={[
        { label: "Service quality", href: "/admin/ops/quality-safeguards/service-quality" },
      ]}
    >
      <QsPlaceholderSection
        title="Service quality"
        wave="Wave 5"
        summary="Care and transport quality signals for human triage."
      />
    </QsOpsShell>
  );
}
