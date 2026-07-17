import { PilotSeedPanel } from "@/components/accessibility-ops/PilotSeedPanel";
import { isAccessibilityOpsFlagEnabled } from "@/lib/accessibility-ops/feature-flags";

export default function AccessibilityOpsPilotPage() {
  const enabled =
    isAccessibilityOpsFlagEnabled("opsEnabled") &&
    isAccessibilityOpsFlagEnabled("assetRegistry");

  return (
    <section aria-labelledby="pilot-heading" className="space-y-4">
      <h2 id="pilot-heading" className="text-xl font-semibold">
        Shadow pilot
      </h2>
      <p className="text-sm text-muted-foreground">
        Seeds synthetic assets for AURA mission UI, Offline Visit Pack, Harbour
        Civic Centre, transport cancellation workflow, and the access-summary
        widget. Does not migrate production incidents or block releases. See{" "}
        <code>docs/accessibility-ops/PILOT_RUNBOOK.md</code>.
      </p>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">
          Enable AccessibilityOps asset registry flags to seed the pilot.
        </p>
      ) : (
        <PilotSeedPanel />
      )}
    </section>
  );
}
