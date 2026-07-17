import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { QsPlaceholderSection } from "@/components/admin/quality-safeguards/QsPlaceholderSection";

export const metadata = {
  title: "Safeguarding cases | Quality & Safeguards | MapAble Admin",
};

export default function Page() {
  return (
    <QsOpsShell
      title="Safeguarding cases"
      description="Restricted safeguarding case management distinct from ordinary incidents."
      breadcrumbExtra={[
        { label: "Safeguarding cases", href: "/admin/ops/quality-safeguards/safeguarding" },
      ]}
    >
      <QsPlaceholderSection
        title="Safeguarding cases"
        wave="Wave 3"
        summary="Restricted safeguarding case management distinct from ordinary incidents."
      />
    </QsOpsShell>
  );
}
