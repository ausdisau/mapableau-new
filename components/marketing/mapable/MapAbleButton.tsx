import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/app/lib/utils";

const variants = {
  primary:
    "bg-mapable-blue text-white hover:bg-mapable-blue/90 border border-transparent",
  secondary:
    "bg-mapable-teal text-white hover:bg-mapable-teal/90 border border-transparent",
  outline:
    "border border-mapable-blue/30 text-mapable-navy hover:bg-mapable-soft bg-white",
  ghost: "text-mapable-blue hover:bg-mapable-soft border border-transparent",
} as const;

type MapAbleButtonProps = {
  variant?: keyof typeof variants;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"button">, "className">;

export function MapAbleButton({
  variant = "primary",
  href,
  className,
  children,
  type = "button",
  ...props
}: MapAbleButtonProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition mapable-focus-ring",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
