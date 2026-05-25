import type { UserRole } from "@/types/mapable";

import { RoleAwareNavigation } from "./RoleAwareNavigation";

export function DesktopSidebar({ role }: { role: UserRole }) {
  return (
    <aside className="hidden md:block w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
      <RoleAwareNavigation role={role} variant="desktop" />
    </aside>
  );
}
