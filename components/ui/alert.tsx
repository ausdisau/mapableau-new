import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import * as React from "react";

import { cn } from "@/app/lib/utils";

const alertVariants = cva(
  "relative flex gap-3 rounded-xl border p-4 text-sm leading-6",
  {
    variants: {
      variant: {
        success: "border-[hsl(var(--status-success)/0.35)] bg-[hsl(var(--status-success)/0.08)] text-foreground",
        warning: "border-[hsl(var(--status-warning)/0.45)] bg-[hsl(var(--status-warning)/0.12)] text-foreground",
        error: "border-[hsl(var(--status-error)/0.35)] bg-[hsl(var(--status-error)/0.08)] text-foreground",
        info: "border-[hsl(var(--status-info)/0.35)] bg-[hsl(var(--status-info)/0.08)] text-foreground",
        blocked: "border-[hsl(var(--status-blocked)/0.35)] bg-[hsl(var(--status-blocked)/0.08)] text-foreground",
        review: "border-[hsl(var(--status-review)/0.55)] bg-[hsl(var(--status-review)/0.18)] text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const iconMap = {
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
  info: Info,
  blocked: ShieldAlert,
  review: TriangleAlert,
} as const;

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string;
    live?: "off" | "polite" | "assertive";
  };

export function Alert({
  className,
  variant = "info",
  title,
  children,
  live = "off",
  ...props
}: AlertProps) {
  const Icon = iconMap[variant ?? "info"];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={live === "off" ? undefined : live}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </div>
  );
}
