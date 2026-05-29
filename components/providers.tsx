"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { BrandProvider } from "@/app/contexts/BrandContext";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <BrandProvider>{children}</BrandProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
