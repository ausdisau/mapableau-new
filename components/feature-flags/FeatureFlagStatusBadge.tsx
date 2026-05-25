import { Badge } from "@/components/ui/badge";

export function FeatureFlagStatusBadge({
  enabled,
  killSwitch,
}: {
  enabled: boolean;
  killSwitch: boolean;
}) {
  if (killSwitch) {
    return (
      <Badge variant="destructive" aria-label="Kill switch active">
        Kill switch
      </Badge>
    );
  }
  return (
    <Badge variant={enabled ? "default" : "secondary"} aria-label={enabled ? "Enabled" : "Disabled"}>
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}
