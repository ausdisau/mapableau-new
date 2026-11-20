import type { ReactNode } from "react";

import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { OneAppShell } from "@/components/mapable-one";
import type { CurrentUser } from "@/lib/auth/current-user";
import { roleLabel } from "@/lib/auth/roles";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";
import { resolveOneShellChrome } from "@/lib/mapable-one/shell-nav";
import { resolveWorkspaceAvailability } from "@/lib/mapable-one/workspace-access";
import type { UserRole } from "@/types/mapable";

export function AuthenticatedRoleAppShell({
  user,
  headerTitle,
  secondaryNav,
  children,
  logoHref = "/dashboard",
}: {
  user: CurrentUser;
  headerTitle: string;
  secondaryNav: ReactNode;
  children: ReactNode;
  logoHref?: string;
}) {
  const role = user.primaryRole as UserRole;

  if (isMapAbleOneUnifiedShellEnabled()) {
    const chrome = resolveOneShellChrome(headerTitle);
    const workspaces = resolveWorkspaceAvailability(user);
    return (
      <OneAppShell
        workspaces={workspaces}
        currentWorkspace={chrome.workspaceId}
        workspaceLabel={chrome.workspaceLabel}
        contextLabel={`${roleLabel(role)} · ${headerTitle}`}
        userName={user.name}
        logoHref={logoHref === "/dashboard" ? chrome.logoHref : logoHref}
        navLinks={chrome.navLinks}
        headerActions={<MapAbleUserBar userName={user.name} role={role} />}
        mobileLinks={chrome.navLinks.slice(0, 4)}
      >
        {children}
      </OneAppShell>
    );
  }

  return (
    <MapAbleRoleAppShell
      headerTitle={headerTitle}
      logoHref={logoHref}
      headerActions={
        <MapAbleUserBar userName={user.name} role={role} />
      }
      secondaryNav={secondaryNav}
    >
      {children}
    </MapAbleRoleAppShell>
  );
}
