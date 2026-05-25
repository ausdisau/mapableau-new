"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const authProvider =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_AUTH_PROVIDER === "nextauth"
      ? "nextauth"
      : "auth0";

  const inner = (
    <QueryProvider>
      <BrandProvider>{children}</BrandProvider>
    </QueryProvider>
  );

  if (authProvider === "nextauth") {
    return <SessionProvider>{inner}</SessionProvider>;
  }

  return inner;
}
