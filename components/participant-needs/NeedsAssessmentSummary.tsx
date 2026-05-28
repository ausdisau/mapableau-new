import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  NeedsAssessmentRecommendation,
  NeedsAssessmentResult,
} from "@/lib/participant-needs/types";

export function NeedsAssessmentSummary({
  result,
}: {
  result: NeedsAssessmentResult;
}) {
  const domains = [...new Set(result.snapshot.signals.map((s) => s.domain))];

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Assessment summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{result.summary}</p>
          <p className="text-muted-foreground">
            Profile completeness: {result.snapshot.profileCompletionPercent}%
          </p>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Badge key={domain} variant="secondary">
                {domain.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-base">Gaps to review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.snapshot.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No major gaps detected in core domains.
            </p>
          ) : (
            result.snapshot.gaps.map((gap) => (
              <div
                key={`${gap.domain}-${gap.reason}`}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="font-medium">{gap.domain.replace(/_/g, " ")}</p>
                <p className="text-muted-foreground">{gap.reason}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-base">Recommended next steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.recommendations.map((rec) => (
            <RecommendationRow key={rec.id} recommendation={rec} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationRow({
  recommendation,
}: {
  recommendation: NeedsAssessmentRecommendation;
}) {
  if (recommendation.href) {
    return (
      <Link
        href={recommendation.href}
        className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
      >
        <span>{recommendation.label}</span>
        <span className="text-xs text-muted-foreground">Open</span>
      </Link>
    );
  }

  return (
    <div className="rounded-lg border p-3 text-sm">
      <span>{recommendation.label}</span>
    </div>
  );
}
