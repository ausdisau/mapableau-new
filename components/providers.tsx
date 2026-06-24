"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { AdRailRootWrapper } from "@/components/ads/AdRailRootWrapper";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>
          <AdRailRootWrapper>{children}</AdRailRootWrapper>
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
