import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Evidence (placeholder) | Access Signals" };

export default function AccessSignalsEvidencePage() {
  return (
    <AccessSignalsShell activePath="/access-signals/evidence">
      <PlaceholderPanel
        title="Evidence"
        description="Evidence capture and review will live here in a later phase. This demo does not store or publish evidence."
      />
    </AccessSignalsShell>
  );
}
