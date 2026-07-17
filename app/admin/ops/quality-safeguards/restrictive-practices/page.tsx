import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Restrictive practices | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Restrictive practices"
      description="Behaviour-support governance behind FEATURE_BEHAVIOUR_SUPPORT_GOVERNANCE. Governance and evidence only — does not authorise practices."
      breadcrumbExtra={[
        { label: "Restrictive practices", href: "/admin/ops/quality-safeguards/restrictive-practices" },
      ]}
    >
      <QsPlaceholderSection
        title="Restrictive practices"
        wave="Wave 8"
        summary="Behaviour-support governance behind FEATURE_BEHAVIOUR_SUPPORT_GOVERNANCE. Governance and evidence only — does not authorise practices."
      />
    </QsOpsShell>
  );
}
