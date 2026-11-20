import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export type MapAbleWorkspaceId =
  | "core"
  | "provider"
  | "worker"
  | "search"
  | "admin"
  | "driver"
  | "employer"
  | "other";

export type WorkspaceAvailability = {
  id: MapAbleWorkspaceId;
  label: string;
  href: string;
  available: boolean;
  reason?: string;
};

/**
 * Server-authoritative workspace availability for the switcher.
 * Selecting a workspace never grants privileges — each route still guards.
 */
export function resolveWorkspaceAvailability(
  user: CurrentUser
): WorkspaceAvailability[] {
  const role = user.primaryRole as UserRole;
  const canProvider = hasPermission(role, "care:read:org");
  const canWorker = hasPermission(role, "care:shift:work");
  const canAdmin = isAdminRole(role);

  const workspaces: WorkspaceAvailability[] = [
    {
      id: "search",
      label: "MapAble Search",
      href: "/search",
      available: true,
    },
    {
      id: "core",
      label: "MapAble Core",
      href: "/dashboard",
      available: true,
    },
    {
      id: "provider",
      label: "MapAble Provider",
      href: "/provider",
      available: canProvider,
      reason: canProvider
        ? undefined
        : "Not available — requires an active provider organisation membership.",
    },
    {
      id: "worker",
      label: "MapAble Worker",
      href: "/worker/today",
      available: canWorker,
      reason: canWorker
        ? undefined
        : "Not available — requires an active worker profile affiliation.",
    },
  ];

  if (canAdmin) {
    workspaces.push({
      id: "admin",
      label: "MapAble Admin",
      href: "/admin",
      available: true,
    });
  }

  return workspaces;
}
