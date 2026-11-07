import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Settings (placeholder) | Access Signals",
};

export default function AccessSignalsSettingsPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/settings">
      <PlaceholderPanel
        title="Settings"
        description="Access Signals settings are not configurable in the synthetic demo."
      />
    </AccessSignalsShell>
  );
}
