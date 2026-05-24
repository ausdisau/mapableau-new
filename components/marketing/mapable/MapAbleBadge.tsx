import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";

export function MapAbleBadge({
  children,
  className,
  tone = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "primary" | "teal" | "yellow" | "neutral";
}) {
  const tones = {
    primary: "border-mapable-blue/25 bg-mapable-blue/10 text-mapable-blue",
    teal: "border-mapable-teal/25 bg-mapable-teal/10 text-mapable-teal",
    yellow: "border-mapable-yellow/40 bg-mapable-yellow/15 text-mapable-navy",
    neutral: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}
    >
      {children}
    </Badge>
  );
}
