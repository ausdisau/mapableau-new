import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  mapableStatusClassForKey,
  mapableStatusToneForKey,
} from "@/lib/brand/status-styles";

const STATUS_LABELS: Record<string, string> = {
  awaiting_provider_acceptance: "Awaiting provider",
  in_progress: "In progress",
  not_started: "Not started",
  pending_review: "Pending review",
  pending_payment: "Pending payment",
};

function formatStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = mapableStatusToneForKey(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        mapableStatusClassForKey(status),
        className,
      )}
      data-status-tone={tone}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
