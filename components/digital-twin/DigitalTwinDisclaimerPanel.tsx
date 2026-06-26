import { DIGITAL_TWIN_DISCLAIMER } from "@/lib/digital-twin/constants";

export function DigitalTwinDisclaimerPanel() {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      aria-label="Digital Twin information disclaimer"
    >
      {DIGITAL_TWIN_DISCLAIMER}
    </aside>
  );
}
