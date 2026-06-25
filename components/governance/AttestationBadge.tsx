import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import React from "react";

export type AttestationStatus = "confirmed" | "review_required" | "blocked" | "recorded";

const config: Record<
  AttestationStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]",
  },
  review_required: {
    label: "Review required",
    icon: Clock,
    className: "bg-[hsl(var(--status-review)/0.25)] text-foreground",
  },
  blocked: {
    label: "Blocked",
    icon: ShieldAlert,
    className: "bg-[hsl(var(--status-blocked)/0.12)] text-foreground",
  },
  recorded: {
    label: "Attestation recorded",
    icon: CheckCircle2,
    className: "bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]",
  },
};

export type AttestationBadgeProps = {
  status: AttestationStatus;
};

export function AttestationBadge({ status }: AttestationBadgeProps) {
  const { label, icon: Icon, className } = config[status];
  return (
    <Badge variant="default" className={`gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
