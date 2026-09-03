import * as React from "react";

import { cn } from "../lib/cn";
import { Card } from "../primitives/card";

export interface ModuleCardProps {
  title: string;
  description?: string;
  eyebrow?: string;
  href?: string;
  icon?: React.ReactNode;
  meta?: string;
  className?: string;
  children?: React.ReactNode;
  as?: "div" | "article";
  linkComponent?: React.ElementType;
}

export function ModuleCard({
  title,
  description,
  eyebrow,
  href,
  icon,
  meta,
  className,
  children,
  as: Tag = "article",
  linkComponent: LinkComponent,
}: ModuleCardProps) {
  const content = (
    <>
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-1 flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 shrink-0 text-[#005B7F]" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-[#0C1833]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
          {meta ? (
            <p className="mt-2 text-xs font-semibold text-[#005B7F]">{meta}</p>
          ) : null}
          {children}
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    "p-5 transition hover:border-[#005B7F]/30 hover:shadow-md",
    href ? "cursor-pointer" : "",
    className,
  );

  if (href && LinkComponent) {
    return (
      <LinkComponent href={href} className="block no-underline">
        <Card variant="marketing" className={cardClass} data-testid="mapable-module-card">
          {content}
        </Card>
      </LinkComponent>
    );
  }

  return (
    <Tag>
      <Card variant="marketing" className={cardClass} data-testid="mapable-module-card">
        {content}
      </Card>
    </Tag>
  );
}
