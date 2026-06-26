import { VERIFICATION_LEVEL_INFO, verificationLevelForScore } from "@/lib/trust/trust-score";
import type { VerificationLevel } from "@/types/wedges";
import { VERIFICATION_DISCLAIMER } from "@/types/wedges";

type VerificationBadgeProps = {
  level: VerificationLevel;
};

export function VerificationBadge({ level }: VerificationBadgeProps) {
  const info = VERIFICATION_LEVEL_INFO[level];
  return (
    <span
      className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
      aria-label={`MapAble verification level: ${info.badgeText}`}
    >
      {info.badgeText}
    </span>
  );
}

export function VerificationRequirements({ level }: { level: VerificationLevel }) {
  const info = VERIFICATION_LEVEL_INFO[level];
  return (
    <div className="space-y-2 text-sm">
      <p>
        <strong>Requirements:</strong> {info.requirements}
      </p>
      <p>
        <strong>Review period:</strong> {info.reviewPeriod}
      </p>
      <p className="text-muted-foreground">
        <strong>What this does not mean:</strong> {info.doesNotMean}
      </p>
      <p className="text-xs text-muted-foreground" role="note">
        {VERIFICATION_DISCLAIMER}
      </p>
    </div>
  );
}

export function VerificationBadgeFromScore({
  score,
  hasAccessVerified,
}: {
  score: number;
  hasAccessVerified: boolean;
}) {
  const level = verificationLevelForScore(score, hasAccessVerified);
  return <VerificationBadge level={level} />;
}
