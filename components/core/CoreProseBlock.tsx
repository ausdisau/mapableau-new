import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export function CoreProseBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("prose prose-sm max-w-none text-foreground", className)}>
      {children}
    </div>
  );
}
