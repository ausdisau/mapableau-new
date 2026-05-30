import Link from "next/link";
import type { ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import {
  mapableHeaderClass,
  mapableModuleBackLinkClass,
  mapableModuleMainClass,
} from "@/lib/brand/styles";

export function ModuleShell({
  homeHref,
  homeLabel,
  navAriaLabel,
  nav,
  backLink,
  children,
}: {
  homeHref: string;
  homeLabel: string;
  navAriaLabel: string;
  nav: ReactNode;
  backLink?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <header className={mapableHeaderClass}>
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
          aria-label={navAriaLabel}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={homeHref}
              className="font-heading text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {homeLabel}
            </Link>
            {nav}
          </div>
          {backLink ? (
            <Link href={backLink.href} className={mapableModuleBackLinkClass}>
              {backLink.label}
            </Link>
          ) : null}
        </nav>
      </header>
      <main id="main-content" className={mapableModuleMainClass}>
        {children}
      </main>
    </div>
  );
}
