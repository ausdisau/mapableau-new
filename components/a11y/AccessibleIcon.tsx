import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/app/lib/utils";

export type AccessibleIconProps = {
  icon: LucideIcon;
  label: string;
  decorative?: boolean;
  className?: string;
};

export function AccessibleIcon({
  icon: Icon,
  label,
  decorative = false,
  className,
}: AccessibleIconProps) {
  if (decorative) {
    return <Icon className={cn("h-5 w-5 shrink-0", className)} aria-hidden="true" />;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className={cn("h-5 w-5 shrink-0", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
