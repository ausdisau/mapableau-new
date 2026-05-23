"use client";

import Link from "next/link";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { Button } from "@/components/ui/button";
import { MAPABLE_MARKETING_NAV } from "@/lib/brand/marketing-nav";

export function MapAbleMarketingHeader() {
  return (
    <MapAbleSiteHeader
      logoHref="/provider-finder"
      logoTitle="MapAble"
      logoSubtitle="Empowering Independence"
      navItems={MAPABLE_MARKETING_NAV}
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      }
    />
  );
}
