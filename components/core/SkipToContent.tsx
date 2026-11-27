import React from "react";

import { SkipToSearchLink } from "@/components/core/SkipToSearchLink";

const skipLinkClass =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground";

type Props = {
  /** Only marketing shells that mount `#mapable-header-search` should enable this. */
  includeSearchSkip?: boolean;
};

export function SkipToContent({ includeSearchSkip = false }: Props) {
  return (
    <>
      <a href="#main-content" className={skipLinkClass}>
        Skip to main content
      </a>
      {includeSearchSkip ? <SkipToSearchLink /> : null}
    </>
  );
}
