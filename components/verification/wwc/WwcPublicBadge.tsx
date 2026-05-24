import { publicBadgeLabelForStatus } from "@/lib/verification/wwc/wwc-eligibility-service";
import type { WwcVerificationStatus } from "@/types/wwc-verification";

export function WwcPublicBadge({
  status,
}: {
  status: WwcVerificationStatus | null;
}) {
  const label = publicBadgeLabelForStatus(status as never);
  const tone =
    status === "approved" || status === "not_required"
      ? "border-green-600/40 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
      : status === "pending_review" || status === "draft"
        ? "border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
      title={label}
    >
      <span className="sr-only">Child-related check: </span>
      {label}
    </span>
  );
}
