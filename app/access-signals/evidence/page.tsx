import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Evidence review — not connected | Access Signals" };

export default function AccessSignalsEvidencePage() {
  return (
    <AccessSignalsShell activePath="/access-signals/evidence">
      <PlaceholderPanel
        title="Evidence"
        description="Evidence intake and review are not connected to this screen. No submitted evidence, review decision or public accessibility record is created."
      />
    </AccessSignalsShell>
  );
}
