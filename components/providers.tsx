"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
<<<<<<< HEAD
import { CapacitorNativeProvider } from "@/components/capacitor/CapacitorNativeProvider";
=======
import { AdSenseRootWrapper } from "@/components/ads/AdSenseRootWrapper";
>>>>>>> origin/cursor/adsense-skyscrapers-4b0e
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>
<<<<<<< HEAD
          <CapacitorNativeProvider>{children}</CapacitorNativeProvider>
=======
          <AdSenseRootWrapper>{children}</AdSenseRootWrapper>
>>>>>>> origin/cursor/adsense-skyscrapers-4b0e
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
