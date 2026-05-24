"use client";

import Link from "next/link";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { Button } from "@/components/ui/button";
import { MAPABLE_MARKETING_NAV } from "@/lib/brand/marketing-nav";

/**
 * Marketing-only header — does not affect dashboard/app headers.
 */
export function MarketingHeader() {
  return (
    <MapAbleSiteHeader
      logoHref="/"
      logoVariant="full"
      navItems={MAPABLE_MARKETING_NAV}
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="min-h-11 mapable-focus-ring"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="default" size="sm" asChild className="min-h-11 mapable-focus-ring">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      }
    />
  );
}
