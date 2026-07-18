import { roleLabel } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

/**
 * Derive up to two initials for avatar fallback.
 * Prefer display name; use email local-part only when no usable name exists.
 */
export function getUserInitials(
  name: string | null | undefined,
  email?: string | null
): string {
  const trimmedName = name?.trim() ?? "";
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/u).filter(Boolean);
    if (parts.length === 1) {
      return Array.from(parts[0]).slice(0, 2).join("").toLocaleUpperCase();
    }
    const first = Array.from(parts[0])[0] ?? "";
    const last = Array.from(parts[parts.length - 1])[0] ?? "";
    return `${first}${last}`.toLocaleUpperCase();
  }

  const local = email?.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  return Array.from(local).slice(0, 2).join("").toLocaleUpperCase();
}

export function getAccountMenuButtonLabel(
  userName: string | null | undefined,
  role: UserRole | string | null | undefined
): string {
  const displayName = userName?.trim() || "account";
  const roleText = role ? roleLabel(role as UserRole) : "user";
  return `Open account menu for ${displayName}. Signed in as ${roleText}.`;
}

/** Append cache-busting version from avatarUpdatedAt when a URL exists. */
export function withAvatarCacheVersion(
  avatarUrl: string | null | undefined,
  avatarUpdatedAt?: Date | string | null
): string | null {
  if (!avatarUrl) return null;
  if (!avatarUpdatedAt) return avatarUrl;
  const version =
    avatarUpdatedAt instanceof Date
      ? avatarUpdatedAt.getTime()
      : new Date(avatarUpdatedAt).getTime();
  if (Number.isNaN(version)) return avatarUrl;
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${separator}v=${version}`;
}

export type AccountMenuAction = {
  href: string;
  label: string;
};

/**
 * Profile / settings links that already exist for the role.
 * Unavailable destinations are omitted rather than inventing empty routes.
 */
export function getAccountMenuActions(
  role: UserRole | string | null | undefined
): AccountMenuAction[] {
  const actions: AccountMenuAction[] = [];

  const profileHref = profileHrefForRole(role);
  if (profileHref) {
    actions.push({ href: profileHref, label: "View profile" });
  }

  actions.push({
    href: "/dashboard/settings/notifications",
    label: "Notification settings",
  });

  actions.push({
    href: "/dashboard/accessibility",
    label: "Accessibility preferences",
  });

  return actions;
}

function profileHrefForRole(
  role: UserRole | string | null | undefined
): string | null {
  if (role === "support_worker") return "/worker/profile";
  if (role === "driver") return "/driver/profile";
  if (
    role === "mapable_admin" ||
    role === "provider_admin" ||
    role === "transport_operator" ||
    role === "employer" ||
    role === "plan_manager" ||
    role === "support_coordinator"
  ) {
    return null;
  }
  return "/dashboard/profile";
}
