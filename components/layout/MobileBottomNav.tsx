import type { UserRole } from "@/types/mapable";

import { RoleAwareNavigation } from "./RoleAwareNavigation";

export function MobileBottomNav({ role }: { role: UserRole }) {
  return <RoleAwareNavigation role={role} variant="mobile" />;
}
