import { Badge } from "@/components/ui/badge";

export function SupportTicketStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <Badge variant="secondary">{label}</Badge>;
}
