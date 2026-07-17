import type { TenantStatus } from "@prisma/client";

export type LifecycleTransition = {
  from: TenantStatus;
  to: TenantStatus;
  reasonRequired: boolean;
};

const ALLOWED: LifecycleTransition[] = [
  { from: "prospective", to: "onboarding", reasonRequired: true },
  { from: "onboarding", to: "active_limited", reasonRequired: true },
  { from: "active_limited", to: "active", reasonRequired: true },
  { from: "active", to: "restricted", reasonRequired: true },
  { from: "active_limited", to: "restricted", reasonRequired: true },
  { from: "restricted", to: "active", reasonRequired: true },
  { from: "active", to: "suspended", reasonRequired: true },
  { from: "active_limited", to: "suspended", reasonRequired: true },
  { from: "restricted", to: "suspended", reasonRequired: true },
  { from: "suspended", to: "active", reasonRequired: true },
  { from: "active", to: "offboarding", reasonRequired: true },
  { from: "active_limited", to: "offboarding", reasonRequired: true },
  { from: "suspended", to: "offboarding", reasonRequired: true },
  { from: "restricted", to: "offboarding", reasonRequired: true },
  { from: "offboarding", to: "archived", reasonRequired: true },
];

export function isTransitionAllowed(
  from: TenantStatus,
  to: TenantStatus
): boolean {
  if (from === to) return false;
  return ALLOWED.some((t) => t.from === from && t.to === to);
}

export function assertTransitionAllowed(
  from: TenantStatus,
  to: TenantStatus
): void {
  if (!isTransitionAllowed(from, to)) {
    throw new Error(`TENANT_STATUS_TRANSITION_DENIED:${from}->${to}`);
  }
}

export function reasonRequired(from: TenantStatus, to: TenantStatus): boolean {
  const t = ALLOWED.find((x) => x.from === from && x.to === to);
  return t?.reasonRequired ?? true;
}

export function allowedNextStatuses(from: TenantStatus): TenantStatus[] {
  return ALLOWED.filter((t) => t.from === from).map((t) => t.to);
}
