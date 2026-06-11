import { Badge } from "@/components/ui/badge";
import { cn } from "@/app/lib/utils";

type PriceLimitStatus = "pass" | "warning" | "fail" | "unknown";

const STATUS_CONFIG: Record<
  PriceLimitStatus,
  { label: string; className: string }
> = {
  pass: {
    label: "Within price limit",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  warning: {
    label: "Near price limit",
    className: "bg-amber-100 text-amber-900 border-amber-300",
  },
  fail: {
    label: "Over price limit",
    className: "bg-red-100 text-red-900 border-red-300",
  },
  unknown: {
    label: "Price limit unknown",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

export function PriceGuardBadge({
  status,
  className,
}: {
  status: PriceLimitStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
      aria-label={`Price guard: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
