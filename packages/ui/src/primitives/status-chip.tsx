import * as React from "react";

import { cn } from "../lib/cn";

export type StatusChipTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const toneClasses: Record<StatusChipTone, string> = {
  default: "bg-[#005B7F]/10 text-[#005B7F] border-[#005B7F]/20",
  success: "bg-[#00A979]/10 text-[#00A979] border-[#00A979]/20",
  warning: "bg-[#F8C51C]/20 text-[#0C1833] border-[#F8C51C]/40",
  danger: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusChipTone;
  label: string;
}

export function StatusChip({
  tone = "default",
  label,
  className,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
      data-testid="mapable-status-chip"
      {...props}
    >
      {label}
    </span>
  );
}
