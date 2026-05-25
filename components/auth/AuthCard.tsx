import React, { type ReactNode } from "react";

import { cn } from "@/app/lib/utils";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AuthCard({
  title,
  description,
  children,
  className,
}: AuthCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8",
        className,
      )}
      aria-labelledby="auth-card-heading"
    >
      <header className="mb-6 space-y-2">
        <h1
          id="auth-card-heading"
          className="font-heading text-2xl font-bold tracking-tight text-foreground"
        >
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
