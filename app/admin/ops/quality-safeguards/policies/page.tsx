import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Policies | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Policies"
      description="Policy lifecycle, acknowledgements, and Easy Read participant-facing versions."
      breadcrumbExtra={[
        { label: "Policies", href: "/admin/ops/quality-safeguards/policies" },
      ]}
    >
      <QsPlaceholderSection
        title="Policies"
        wave="Wave 6"
        summary="Policy lifecycle, acknowledgements, and Easy Read participant-facing versions."
      />
    </QsOpsShell>
  );
}
