import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Complaints | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Complaints"
      description="Accessible complaints centre with anonymous intake, Four A's resolution, and participant timelines."
      breadcrumbExtra={[
        { label: "Complaints", href: "/admin/ops/quality-safeguards/complaints" },
      ]}
    >
      <QsPlaceholderSection
        title="Complaints"
        wave="Wave 3"
        summary="Accessible complaints centre with anonymous intake, Four A's resolution, and participant timelines."
      />
    </QsOpsShell>
  );
}
