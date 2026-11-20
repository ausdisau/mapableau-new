"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { AccessibilityPreferencesProvider } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { AskMapAbleWidget } from "@/components/ask-mapable/AskMapAbleWidget";
import { SessionExpiryWarning } from "@/components/auth/SessionExpiryWarning";
import { OfflineIndicatorBanner } from "@/components/offline/OfflineIndicatorBanner";
import { ServiceWorkerRegister } from "@/components/offline/ServiceWorkerRegister";
import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";
import { QueryProvider } from "@/lib/hooks/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const content = isFirstPartyAccessibilityPanelEnabled() ? (
    <AccessibilityPreferencesProvider>
      {children}
    </AccessibilityPreferencesProvider>
  ) : (
    children
  );

  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <QueryProvider>
        <BrandProvider>
          <ServiceWorkerRegister />
          <OfflineIndicatorBanner />
          {content}
          <SessionExpiryWarning />
          <AskMapAbleWidget />
        </BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
