import type { ReactNode } from "react";

// ReactNode used for title with brand colour spans

import { Badge } from "@/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";

export function CorePageHeader({
  title,
  description,
  eyebrow,
  centered,
  children,
  className,
}: {
  title: ReactNode;
  description?: string;
  eyebrow?: string;
  centered?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "space-y-4",
        centered ? "mx-auto max-w-3xl text-center" : "border-b border-border/60 pb-8",
        className
      )}
    >
      {eyebrow ? (
        <Badge variant="outline" className={cn("w-fit", mapableEyebrowBadgeClass, centered && "mx-auto")}>
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className={cn("text-base text-muted-foreground sm:text-lg", centered && "mx-auto")}>
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
