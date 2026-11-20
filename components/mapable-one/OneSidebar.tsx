import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";
import { OneWorkspaceSwitcher } from "@/components/mapable-one/OneWorkspaceSwitcher";

export type OneNavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

type Props = {
  workspaces: WorkspaceAvailability[];
  currentWorkspace: WorkspaceAvailability["id"];
  links: OneNavLink[];
  pathname?: string;
};

function isActive(link: OneNavLink, pathname: string | undefined): boolean {
  if (!pathname) return false;
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function OneSidebar({
  workspaces,
  currentWorkspace,
  links,
  pathname,
}: Props) {
  return (
    <aside
      className="mo-sidebar hidden w-64 shrink-0 flex-col gap-6 p-4 lg:flex"
      aria-label="Primary"
    >
      <OneWorkspaceSwitcher
        workspaces={workspaces}
        current={currentWorkspace}
      />
      <nav aria-label="Section navigation">
        <p className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mo-muted)]">
          In this workspace
        </p>
        <ul className="mt-1 space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="mo-nav-link"
                aria-current={isActive(link, pathname) ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
