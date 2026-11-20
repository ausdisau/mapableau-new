import type { ReactNode } from "react";

import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";
import {
  OneSidebar,
  type OneNavLink,
} from "@/components/mapable-one/OneSidebar";
import { OneTopbar } from "@/components/mapable-one/OneTopbar";

type Props = {
  children: ReactNode;
  workspaces: WorkspaceAvailability[];
  currentWorkspace: WorkspaceAvailability["id"];
  workspaceLabel: string;
  contextLabel: string;
  userName: string;
  logoHref: string;
  navLinks: OneNavLink[];
  pathname?: string;
  headerActions?: React.ReactNode;
  /** Compact mobile bottom links (subset of navLinks). */
  mobileLinks?: OneNavLink[];
};

/**
 * Shared MapAble One shell. Apply only when MAPABLE_ONE_UNIFIED_SHELL_ENABLED.
 * Does not replace server-side auth — layouts must still call guards.
 */
export function OneAppShell({
  children,
  workspaces,
  currentWorkspace,
  workspaceLabel,
  contextLabel,
  userName,
  logoHref,
  navLinks,
  pathname,
  headerActions,
  mobileLinks,
}: Props) {
  const bottom = mobileLinks ?? navLinks.slice(0, 4);

  return (
    <div
      className="mapable-one min-h-screen"
      data-testid="mapable-one-shell"
      data-workspace={currentWorkspace}
    >
      <a href="#mapable-one-main" className="mo-skip">
        Skip to content
      </a>
      <OneTopbar
        workspaceLabel={workspaceLabel}
        contextLabel={contextLabel}
        userName={userName}
        logoHref={logoHref}
        actions={headerActions}
      />
      <div className="mx-auto flex max-w-7xl">
        <OneSidebar
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          links={navLinks}
          pathname={pathname}
        />
        <main
          id="mapable-one-main"
          className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8"
        >
          {children}
        </main>
      </div>
      <nav
        className="mo-bottom-nav fixed inset-x-0 bottom-0 z-40 flex justify-around gap-1 px-2 py-2 lg:hidden"
        aria-label="Mobile workspace navigation"
      >
        {bottom.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="mo-nav-link flex-1 justify-center text-center text-xs"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
