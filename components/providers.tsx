"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { CapacitorNativeProvider } from "@/components/capacitor/CapacitorNativeProvider";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>
          <CapacitorNativeProvider>{children}</CapacitorNativeProvider>
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
