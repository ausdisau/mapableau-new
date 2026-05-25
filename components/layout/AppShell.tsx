"use client";

import { useEffect, useState } from "react";

import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { MobileAppShell } from "@/components/layout/MobileAppShell";

function useIsDesktop(): boolean | null {
  const [desktop, setDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return desktop;
}

/**
 * Responsive app shell: one shell in the DOM (avoids duplicate main-content ids).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const desktop = useIsDesktop();

  if (desktop === null) {
    return <MobileAppShell>{children}</MobileAppShell>;
  }

  return desktop ? (
    <DesktopAppShell>{children}</DesktopAppShell>
  ) : (
    <MobileAppShell>{children}</MobileAppShell>
  );
}
