import type { AccessNeedProfile, TwinConsentGrant } from "@/lib/digital-twin/types";
import { DEMO_ACCESS_PROFILES } from "@/lib/digital-twin/sample-data";

/** Demo Access Pass profiles — never persist real sensitive data in MVP. */
export function getDemoAccessProfiles(): AccessNeedProfile[] {
  return DEMO_ACCESS_PROFILES.map((p) => ({ ...p }));
}

export function getDemoProfileById(id: string): AccessNeedProfile | undefined {
  return DEMO_ACCESS_PROFILES.find((p) => p.id === id);
}

export interface DemoConsentGrant extends TwinConsentGrant {
  isDemoData: true;
}

const demoGrants: DemoConsentGrant[] = [
  {
    id: "demo-grant-1",
    ownerUserId: "demo-user-wheelchair",
    recipientType: "transport_operator",
    recipientId: "demo-transport-op",
    dataCategories: ["mobility_aids", "transport_needs"],
    purpose: "Plan accessible transport to appointment",
    expiresAt: "2026-12-31T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    isDemoData: true,
  },
];

export function getDemoConsentGrants(): DemoConsentGrant[] {
  return [...demoGrants];
}

export interface ConsentCheckResult {
  allowed: boolean;
  sharedCategories: string[];
  message: string;
  grant?: DemoConsentGrant;
}

/**
 * Evaluates whether a demo consent grant covers requested data categories.
 * TODO: Connect to lib/consent/consent-service.ts for production persistence.
 */
export function checkDemoConsent(input: {
  ownerUserId: string;
  recipientType: TwinConsentGrant["recipientType"];
  dataCategories: string[];
  purpose: string;
}): ConsentCheckResult {
  const grant = demoGrants.find(
    (g) =>
      g.ownerUserId === input.ownerUserId &&
      g.recipientType === input.recipientType &&
      !g.revokedAt &&
      (!g.expiresAt || new Date(g.expiresAt) > new Date())
  );

  if (!grant) {
    return {
      allowed: false,
      sharedCategories: [],
      message: "No active consent grant found for this recipient (demo).",
    };
  }

  const shared = input.dataCategories.filter((c) => grant.dataCategories.includes(c));
  const allowed = shared.length === input.dataCategories.length;

  return {
    allowed,
    sharedCategories: shared,
    message: allowed
      ? "Demo consent covers requested categories."
      : "Demo consent does not cover all requested categories.",
    grant,
  };
}
