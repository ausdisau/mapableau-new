"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { AccessibilityPreferencesProvider } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { AskMapAbleWidget } from "@/components/ask-mapable/AskMapAbleWidget";
import { ClerkNextAuthSignOutBridge } from "@/components/auth/ClerkNextAuthSignOutBridge";
import { OfflineIndicatorBanner } from "@/components/offline/OfflineIndicatorBanner";
import { ServiceWorkerRegister } from "@/components/offline/ServiceWorkerRegister";
import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";
import { QueryProvider } from "@/lib/hooks/query-provider";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
);

export function Providers({ children }: { children: React.ReactNode }) {
  const content = isFirstPartyAccessibilityPanelEnabled() ? (
    <AccessibilityPreferencesProvider>
      {children}
    </AccessibilityPreferencesProvider>
  ) : (
    children
  );

  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>
          {clerkConfigured ? <ClerkNextAuthSignOutBridge /> : null}
          <ServiceWorkerRegister />
          <OfflineIndicatorBanner />
          {content}
          <AskMapAbleWidget />
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
