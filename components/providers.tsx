"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { QueryProvider } from "@/lib/query-provider";

/** App-level React providers — not the MapAble Provider Finder feature. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>{children}</BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
