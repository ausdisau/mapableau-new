import { TIER_LABELS } from "@/lib/digital-twin/constants";
import type { TwinAssessmentTier } from "@/lib/digital-twin/types";
import { Badge } from "@/components/ui/badge";

export function TierBadge({ tier }: { tier: TwinAssessmentTier }) {
  const label = TIER_LABELS[tier] ?? TIER_LABELS.unknown;
  return (
    <Badge variant="outline" aria-label={`Accessibility tier: ${label}`}>
      {label}
    </Badge>
  );
}

export function ScoreLabel({
  score,
  confidence,
}: {
  score: number;
  confidence: number;
}) {
  return (
    <span className="text-sm">
      <span className="sr-only">Accessibility score </span>
      <strong>{score}</strong>
      <span aria-hidden="true">/100</span>
      <span className="mx-2 text-muted-foreground" aria-hidden="true">
        ·
      </span>
      <span className="sr-only">Confidence </span>
      <span className="text-muted-foreground">Confidence {confidence}%</span>
    </span>
  );
}
