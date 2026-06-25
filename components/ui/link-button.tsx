import Link from "next/link";
import * as React from "react";

import { cn } from "@/app/lib/utils";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";

export interface LinkButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> {
  href: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function LinkButton({
  href,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
