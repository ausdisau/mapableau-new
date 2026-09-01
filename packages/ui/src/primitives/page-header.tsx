import * as React from "react";

import { cn } from "../lib/cn";
import { Eyebrow } from "./eyebrow";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn(className)} data-testid="mapable-page-header">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="mt-1 text-3xl font-bold text-[#0C1833]">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
