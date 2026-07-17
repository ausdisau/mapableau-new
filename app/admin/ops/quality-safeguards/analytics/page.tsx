import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Analytics | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Analytics"
      description="De-identified quality analytics with accessible table alternatives and small-cohort suppression."
      breadcrumbExtra={[
        { label: "Analytics", href: "/admin/ops/quality-safeguards/analytics" },
      ]}
    >
      <QsPlaceholderSection
        title="Analytics"
        wave="Wave 5"
        summary="De-identified quality analytics with accessible table alternatives and small-cohort suppression."
      />
    </QsOpsShell>
  );
}
