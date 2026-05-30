import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mapableStatusClassForKey } from "@/lib/brand/status-styles";

export function BillingStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", mapableStatusClassForKey(status))}
    >
      {label}
    </Badge>
  );
}
