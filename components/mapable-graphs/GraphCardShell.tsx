import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/app/lib/utils";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

/** Accessible card shell for participant-facing graph summaries. */
export function GraphCardShell({
  title,
  description,
  children,
  className,
  id,
}: Props) {
  const headingId = id ?? `graph-card-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Card
      variant="outlined"
      className={cn("focus-within:ring-2 focus-within:ring-ring", className)}
      aria-labelledby={headingId}
    >
      <CardHeader>
        <CardTitle id={headingId} className="text-lg sm:text-xl">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 text-base">{children}</CardContent>
    </Card>
  );
}
