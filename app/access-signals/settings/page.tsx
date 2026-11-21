import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Settings — not configurable | Access Signals",
};

export default function AccessSignalsSettingsPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/settings">
      <PlaceholderPanel
        title="Settings"
        description="This preview has no saved account settings. Changes to personal access preferences and sharing controls are not available on this screen."
      />
    </AccessSignalsShell>
  );
}
