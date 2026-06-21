"use client";

import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { BrandProvider } from "@/app/contexts/BrandContext";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <QueryProvider>
        <BrandProvider>{children}</BrandProvider>
      </QueryProvider>
    </SupabaseAuthProvider>
  );
}
