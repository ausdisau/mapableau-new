"use client";

import Link from "next/link";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { Button } from "@/components/ui/button";
import {
  MAPABLE_MARKETING_NAV,
  MAPABLE_MARKETING_NAV_GROUPS,
} from "@/lib/brand/marketing-nav";

export function MapAbleMarketingHeader() {
  const authActions = (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Log in</Link>
      </Button>
      <Button variant="default" size="sm" asChild>
        <Link href="/register">Get started</Link>
      </Button>
    </>
  );

  return (
    <MapAbleSiteHeader
      logoHref="/"
      logoVariant="full"
      navItems={MAPABLE_MARKETING_NAV}
      navGroups={MAPABLE_MARKETING_NAV_GROUPS}
      menuBreakpoint="lg"
      actions={authActions}
    />
  );
}
