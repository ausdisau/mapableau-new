import React from "react";

const skipLinkClass =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground";

export function SkipToContent() {
  return (
    <>
      <a href="#main-content" className={`${skipLinkClass} focus:top-4`}>
        Skip to main content
      </a>
      <a href="#mapable-header-search" className={`${skipLinkClass} focus:top-16`}>
        Skip to search
      </a>
    </>
  );
}
