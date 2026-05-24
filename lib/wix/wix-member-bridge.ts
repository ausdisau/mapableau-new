import { getAuthEnv } from "@/lib/config/auth-env";

const ALLOWED_SYNC_FIELDS = [
  "email",
  "displayName",
  "wixMemberId",
  "marketingStatus",
  "publicMembershipStatus",
] as const;

const BLOCKED_SYNC_FIELDS = [
  "ndisPlanData",
  "invoices",
  "paymentRecords",
  "serviceLogs",
  "supportNotes",
  "disabilityProfile",
  "clinicalRecords",
  "verificationRecords",
  "emergencyProfile",
  "homeAddress",
  "documents",
  "incidentRecords",
  "safeguardingRecords",
] as const;

export type AllowedWixSyncField = (typeof ALLOWED_SYNC_FIELDS)[number];
export type BlockedWixSyncField = (typeof BLOCKED_SYNC_FIELDS)[number];

export function isWixMemberBridgeEnabled(): boolean {
  return getAuthEnv().ENABLE_WIX_MEMBER_BRIDGE === true;
}

export interface WixMemberSnapshot {
  email?: string;
  displayName?: string;
  wixMemberId?: string;
  marketingStatus?: string;
  publicMembershipStatus?: string;
}

export function sanitizeWixSyncPayload(payload: Record<string, unknown>): WixMemberSnapshot {
  const sanitized: WixMemberSnapshot = {};

  for (const key of ALLOWED_SYNC_FIELDS) {
    const value = payload[key];
    if (typeof value === "string") {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function findWixMemberByEmail(_email: string) {
  if (!isWixMemberBridgeEnabled()) {
    return null;
  }

  // Placeholder until Wix API credentials and member-session strategy are confirmed.
  return null;
}

export async function syncWixMemberForProfile(_input: {
  profileId: string;
  auth0UserId: string;
  email: string;
}) {
  if (!isWixMemberBridgeEnabled()) {
    return { enabled: false as const };
  }

  return { enabled: true as const, synced: false, reason: "not_implemented" };
}

export function getBlockedWixSyncFields(): readonly BlockedWixSyncField[] {
  return BLOCKED_SYNC_FIELDS;
}

export function getAllowedWixSyncFields(): readonly AllowedWixSyncField[] {
  return ALLOWED_SYNC_FIELDS;
}
