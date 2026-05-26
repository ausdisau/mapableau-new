"use client";

import Link from "next/link";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { Button } from "@/components/ui/button";
import { MAPABLE_MARKETING_NAV } from "@/lib/brand/marketing-nav";

export function MapAbleMarketingHeader() {
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
            className="rounded-xl border-2 border-foreground px-5 font-black"
            asChild
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-xl px-5 font-black"
            asChild
          >
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      }
    />
  );
}
