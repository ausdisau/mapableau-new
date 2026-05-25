import { Badge } from "@/components/ui/badge";

export function QualitySignalBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" title={label}>
      {label}
    </Badge>
  );
}
