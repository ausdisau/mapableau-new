import type { ReactNode } from "react";

export function CorePageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-2 border-b border-border pb-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
