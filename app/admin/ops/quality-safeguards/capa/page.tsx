import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "CAPA | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="CAPA"
      description="Corrective and preventive actions with mandatory effectiveness review."
      breadcrumbExtra={[
        { label: "CAPA", href: "/admin/ops/quality-safeguards/capa" },
      ]}
    >
      <QsPlaceholderSection
        title="CAPA"
        wave="Wave 5"
        summary="Corrective and preventive actions with mandatory effectiveness review."
      />
    </QsOpsShell>
  );
}
