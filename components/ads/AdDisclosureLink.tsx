import React from "react";
import Link from "next/link";

import { AD_DISCLOSURE } from "@/lib/ads/ad-slot-policy";

export function AdDisclosureLink() {
  return (
    <Link
      href="/core#sponsored-content"
      className="text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={AD_DISCLOSURE}
    >
      Why am I seeing this?
    </Link>
  );
}
