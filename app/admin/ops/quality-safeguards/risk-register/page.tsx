import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Risk register | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Risk register"
      description="Configurable risk categories, controls, and residual risk — not colour-matrix theatre."
      breadcrumbExtra={[
        { label: "Risk register", href: "/admin/ops/quality-safeguards/risk-register" },
      ]}
    >
      <QsPlaceholderSection
        title="Risk register"
        wave="Wave 5"
        summary="Configurable risk categories, controls, and residual risk — not colour-matrix theatre."
      />
    </QsOpsShell>
  );
}
