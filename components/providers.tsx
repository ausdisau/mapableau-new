"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { AdSenseRootWrapper } from "@/components/ads/AdSenseRootWrapper";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>
          <AdSenseRootWrapper>{children}</AdSenseRootWrapper>
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
