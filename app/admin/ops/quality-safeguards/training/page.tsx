import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Training & competency | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Training & competency"
      description="Worker × role × service competency matrix and observed assessments."
      breadcrumbExtra={[
        { label: "Training & competency", href: "/admin/ops/quality-safeguards/training" },
      ]}
    >
      <QsPlaceholderSection
        title="Training & competency"
        wave="Wave 4"
        summary="Worker × role × service competency matrix and observed assessments."
      />
    </QsOpsShell>
  );
}
