export type PrivilegedAccessCheck = {
  role: string;
  permission: string;
  allowed: boolean;
  reason: string;
};

const PRIVILEGED_PERMISSIONS = new Set([
  "assurance:manage",
  "assurance:go-live:decide",
  "admin:ndis:claim:break_glass",
  "admin:actions:write",
]);

export function evaluatePrivilegedAccess(params: {
  role: string;
  permission: string;
  hasPermission: boolean;
}): PrivilegedAccessCheck {
  const isPrivileged = PRIVILEGED_PERMISSIONS.has(params.permission);
  if (!isPrivileged) {
    return {
      role: params.role,
      permission: params.permission,
      allowed: params.hasPermission,
      reason: "standard_permission",
    };
  }
  if (!params.hasPermission) {
    return {
      role: params.role,
      permission: params.permission,
      allowed: false,
      reason: "privileged_permission_denied",
    };
  }
  return {
    role: params.role,
    permission: params.permission,
    allowed: true,
    reason: "privileged_permission_granted",
  };
}
