import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";

type Props = {
  workspaces: WorkspaceAvailability[];
  current: WorkspaceAvailability["id"];
};

/**
 * Navigation-only switcher. Unavailable workspaces show honest copy —
 * clicking available links never grants privileges by itself.
 */
export function OneWorkspaceSwitcher({ workspaces, current }: Props) {
  return (
    <nav aria-label="MapAble workspaces" className="space-y-1">
      <p className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mo-purple)]">
        Workspace
      </p>
      <ul className="space-y-1">
        {workspaces.map((ws) => {
          if (!ws.available) {
            return (
              <li key={ws.id}>
                <span
                  className="mo-nav-link cursor-not-allowed opacity-60"
                  title={ws.reason}
                  aria-disabled="true"
                >
                  {ws.label}
                  <span className="ml-auto text-[10px] font-semibold uppercase text-[var(--mo-muted)]">
                    Not available
                  </span>
                </span>
              </li>
            );
          }

          const isCurrent = ws.id === current;
          return (
            <li key={ws.id}>
              <a
                href={ws.href}
                className="mo-nav-link"
                aria-current={isCurrent ? "page" : undefined}
              >
                {ws.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
