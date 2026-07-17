import { QsHomeDashboard } from "@/components/admin/quality-safeguards/QsHomeDashboard";
import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";

export const metadata = {
  title: "Quality & Safeguards Ops Centre | MapAble Admin",
};

export default function QualitySafeguardsHomePage() {
  return (
    <QsOpsShell
      title="Quality & Safeguards Ops Centre"
      description="Calm mission control for participant safety, rights, incidents, complaints, credentials, and continuous quality improvement."
    >
      <QsHomeDashboard />
    </QsOpsShell>
  );
}
