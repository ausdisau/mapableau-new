import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Route requirements (placeholder) | Access Signals",
};

export default function AccessSignalsRequirementsPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/requirements">
      <PlaceholderPanel
        title="Route requirements"
        description="Route requirement catalogues remain a placeholder in this demo."
      />
    </AccessSignalsShell>
  );
}
