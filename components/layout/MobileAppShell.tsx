import type { ReactNode } from "react";

import type { UserRole } from "@/types/mapable";

import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { SkipToContent } from "./SkipToContent";

interface MobileAppShellProps {
  userName: string;
  role: UserRole;
  children: ReactNode;
}

export function MobileAppShell({
  userName,
  role,
  children,
}: MobileAppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SkipToContent />
      <AppHeader userName={userName} />
      <div className="flex-1 pb-[4.5rem] safe-area-pb">{children}</div>
      <MobileBottomNav role={role} />
    </div>
  );
}
