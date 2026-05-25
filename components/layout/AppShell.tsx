"use client";

import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { MobileAppShell } from "@/components/layout/MobileAppShell";

/**
 * Responsive app shell: mobile bottom nav below md, desktop sidebar from md up.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="md:hidden">
        <MobileAppShell>{children}</MobileAppShell>
      </div>
      <div className="hidden md:block">
        <DesktopAppShell>{children}</DesktopAppShell>
      </div>
    </>
  );
}
