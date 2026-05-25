import type { ReactNode } from "react";

import type { UserRole } from "@/types/mapable";

import { AppHeader } from "./AppHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { SkipToContent } from "./SkipToContent";

interface DesktopAppShellProps {
  userName: string;
  role: UserRole;
  children: ReactNode;
}

export function DesktopAppShell({
  userName,
  role,
  children,
}: DesktopAppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SkipToContent />
      <AppHeader userName={userName} />
      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        <DesktopSidebar role={role} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
