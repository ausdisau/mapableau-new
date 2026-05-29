import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export function CorePageContainer({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto space-y-8 px-4 py-10",
        variant === "narrow" ? "max-w-3xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
