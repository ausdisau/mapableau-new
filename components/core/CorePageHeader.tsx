import type { ReactNode } from "react";

export function CorePageHeader({
  title,
  description,
  eyebrow,
  children,
}: {
  title: ReactNode;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-3xl space-y-4 text-center">
      {eyebrow ? (
        <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
