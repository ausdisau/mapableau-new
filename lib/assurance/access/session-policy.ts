export type SessionPolicy = {
  idleTimeoutMinutes: number;
  absoluteTimeoutHours: number;
  requireReauthForPrivileged: boolean;
};

export const DEFAULT_ASSURANCE_SESSION_POLICY: SessionPolicy = {
  idleTimeoutMinutes: 30,
  absoluteTimeoutHours: 12,
  requireReauthForPrivileged: true,
};

export function sessionRequiresReauth(params: {
  privilegeEscalation: boolean;
  policy?: SessionPolicy;
}): boolean {
  const policy = params.policy ?? DEFAULT_ASSURANCE_SESSION_POLICY;
  return params.privilegeEscalation && policy.requireReauthForPrivileged;
}
