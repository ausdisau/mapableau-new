import React, { type ReactNode } from "react";
import Link from "next/link";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import { MAPABLE_SUPPORT_EMAIL, MAPABLE_TAGLINE } from "@/lib/brand/constants";

type AuthShellProps = {
  children: ReactNode;
  /** Short welcome line beside the form on large screens */
  productMessage?: string;
};

export function AuthShell({
  children,
  productMessage = "Sign in to care, transport, and support — built for accessibility first.",
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/[0.08] via-background to-secondary/[0.06]">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to sign-in form
      </a>

      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <MapAbleLogo href="/provider-finder" variant="full" />
          <Link
            href={`mailto:${MAPABLE_SUPPORT_EMAIL}?subject=Account%20help`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Need help signing in?
          </Link>
        </div>
      </header>

      <main
        id="auth-main"
        className="container mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start lg:py-16"
      >
        <div className="hidden space-y-4 lg:block motion-reduce:transition-none">
          <p className="font-heading text-3xl font-bold leading-tight text-foreground">
            {productMessage}
          </p>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {MAPABLE_TAGLINE}
          </p>
          <p className="text-sm text-muted-foreground">
            MapAble supports participants, carers, providers, workers, drivers,
            coordinators and plan managers. Your account type helps us show the
            right next steps — it does not replace verification for providers
            or workers.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">{children}</div>
      </main>

      <footer className="border-t border-border/50 px-4 py-6 text-center text-xs text-muted-foreground">
        <p>
          By continuing you agree to use MapAble responsibly.{" "}
          <Link
            href="/core"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Learn about MapAble Core
          </Link>
        </p>
      </footer>
    </div>
  );
}
