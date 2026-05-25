import type { ReactNode } from "react";

import type { UserRole } from "@/types/mapable";

import { DesktopAppShell } from "./DesktopAppShell";
import { MobileAppShell } from "./MobileAppShell";

interface AppShellProps {
  userName: string;
  role: UserRole;
  children: ReactNode;
}

/** Responsive shell: mobile bottom nav + desktop sidebar. */
export function AppShell({ userName, role, children }: AppShellProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileAppShell userName={userName} role={role}>
          {children}
        </MobileAppShell>
      </div>
      <div className="hidden md:block">
        <DesktopAppShell userName={userName} role={role}>
          {children}
        </DesktopAppShell>
      </div>
    </>
  );
}
