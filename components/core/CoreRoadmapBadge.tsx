import { Badge } from "@/components/ui/badge";
import { cn } from "@/app/lib/utils";

export type CoreRoadmapBadgeVariant = "live" | "roadmap" | "beta";

const LABELS: Record<CoreRoadmapBadgeVariant, string> = {
  live: "Live",
  roadmap: "Coming soon",
  beta: "Beta",
};

const VARIANT_CLASS: Record<CoreRoadmapBadgeVariant, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  roadmap: "border-border bg-muted text-muted-foreground",
  beta: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
};

export function CoreRoadmapBadge({
  variant,
  className,
}: {
  variant: CoreRoadmapBadgeVariant;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("text-xs font-semibold", VARIANT_CLASS[variant], className)}>
      {LABELS[variant]}
    </Badge>
  );
}
