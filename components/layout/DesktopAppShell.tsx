"use client";

import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { RoleAwareNavigation } from "@/components/layout/RoleAwareNavigation";
import { SafeAreaContainer } from "@/components/layout/SafeAreaContainer";
import { SkipToContent } from "@/components/layout/SkipToContent";

export function DesktopAppShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaContainer>
      <SkipToContent />
      <OfflineBanner />
      <InstallAppPrompt />
      <AppHeader />
      <div className="mx-auto flex max-w-7xl">
        <RoleAwareNavigation />
        <main id="main-content" className="min-w-0 flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </SafeAreaContainer>
  );
}
