import { confidenceLabel } from "@/lib/access-map/access-confidence-service";
import type { AccessConfidenceLevel } from "@prisma/client";

export function AccessConfidenceBadge({
  level,
}: {
  level: AccessConfidenceLevel;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-sm font-medium text-foreground">
      <span aria-hidden="true">◎</span>
      {confidenceLabel(level)}
    </span>
  );
}
