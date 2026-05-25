"use client";

import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { RoleAwareNavigation } from "@/components/layout/RoleAwareNavigation";
import { SafeAreaContainer } from "@/components/layout/SafeAreaContainer";
import { SkipToContent } from "@/components/layout/SkipToContent";

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaContainer withBottomNav>
      <SkipToContent />
      <OfflineBanner />
      <InstallAppPrompt />
      <AppHeader compact />
      <main id="main-content" className="min-h-0 flex-1">
        <PageContainer>{children}</PageContainer>
      </main>
      <RoleAwareNavigation />
    </SafeAreaContainer>
  );
}
