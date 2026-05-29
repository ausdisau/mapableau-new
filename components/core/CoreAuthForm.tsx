"use client";

import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function CoreAuthForm({
  onSubmit,
  error,
  isLoading,
  submitLabel,
  children,
  footer,
}: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error?: string;
  isLoading?: boolean;
  submitLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="default" size="default" className="w-full" disabled={isLoading}>
        {isLoading ? "Please wait…" : submitLabel}
      </Button>
      {footer ? <div className="pt-2 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </form>
  );
}
