import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Route requirements — not connected | Access Signals",
};

export default function AccessSignalsRequirementsPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/requirements">
      <PlaceholderPanel
        title="Route requirements"
        description="A route requirements catalogue is not connected here. Unknown or unassessed features must not be treated as confirmed step-free access."
      />
    </AccessSignalsShell>
  );
}
