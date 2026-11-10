/**
 * Stage 2 — identity-linking proof-of-concept.
 *
 * Requires authenticated control of BOTH a Clerk (AD.iD) session and a Wix
 * Members session. Email-only matching is forbidden. Links are keyed by
 * issuer+subject (Clerk) and Wix memberId — never by email alone.
 *
 * Isolated in-memory store for sandbox tests only. Does not read/write neon_auth
 * or production member databases. Does not mint Wix sessions.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { wixStageFlags } from "./flags.ts";

export type ClerkProof = {
  issuer: string;
  subject: string;
  sessionPresent: boolean;
};

export type WixProof = {
  memberId: string;
  /** Server-verified Wix member session — not a browser-asserted claim. */
  sessionVerifiedByServer: boolean;
};

export type LinkRecord = {
  linkId: string;
  clerkIssuer: string;
  clerkSubject: string;
  wixMemberId: string;
  createdAtMs: number;
  revokedAtMs?: number;
};

export type LinkAttemptResult =
  | { ok: true; link: LinkRecord }
  | { ok: false; reason: string };

export type LinkStore = {
  put(link: LinkRecord): void;
  getByClerk(issuer: string, subject: string): LinkRecord | undefined;
  getByWix(memberId: string): LinkRecord | undefined;
  revoke(linkId: string, atMs: number): boolean;
};

/** Ephemeral sandbox store — never a production DB adapter. */
export function createMemoryLinkStore(): LinkStore {
  const byId = new Map<string, LinkRecord>();
  const byClerk = new Map<string, string>();
  const byWix = new Map<string, string>();

  const clerkKey = (iss: string, sub: string) => `${iss}\0${sub}`;

  return {
    put(link) {
      byId.set(link.linkId, link);
      byClerk.set(clerkKey(link.clerkIssuer, link.clerkSubject), link.linkId);
      byWix.set(link.wixMemberId, link.linkId);
    },
    getByClerk(issuer, subject) {
      const id = byClerk.get(clerkKey(issuer, subject));
      return id ? byId.get(id) : undefined;
    },
    getByWix(memberId) {
      const id = byWix.get(memberId);
      return id ? byId.get(id) : undefined;
    },
    revoke(linkId, atMs) {
      const link = byId.get(linkId);
      if (!link || link.revokedAtMs) return false;
      link.revokedAtMs = atMs;
      return true;
    },
  };
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Attempt to create a durable Clerk↔Wix link after dual proof.
 * Explicitly rejects email-only and missing session proofs.
 */
export function attemptIdentityLink(input: {
  clerk: ClerkProof;
  wix: WixProof;
  matchMethod: "email_only" | "issuer_subject_and_member_id";
  store: LinkStore;
  nowMs?: number;
}): LinkAttemptResult {
  if (!wixStageFlags.identityLinkingEnabled()) {
    return { ok: false, reason: "ADID_ACCOUNT_LINKING_ENABLED is false" };
  }
  if (input.matchMethod === "email_only") {
    return { ok: false, reason: "email_only_linking_forbidden" };
  }
  if (!input.clerk.sessionPresent) {
    return { ok: false, reason: "clerk_session_required" };
  }
  if (!input.wix.sessionVerifiedByServer) {
    return { ok: false, reason: "wix_server_verified_session_required" };
  }
  if (!nonempty(input.clerk.issuer) || !nonempty(input.clerk.subject)) {
    return { ok: false, reason: "clerk_issuer_subject_required" };
  }
  if (!nonempty(input.wix.memberId)) {
    return { ok: false, reason: "wix_member_id_required" };
  }
  if (!/^https:\/\//i.test(input.clerk.issuer)) {
    return { ok: false, reason: "clerk_issuer_must_be_https" };
  }

  const existingClerk = input.store.getByClerk(input.clerk.issuer, input.clerk.subject);
  if (existingClerk && !existingClerk.revokedAtMs) {
    return { ok: false, reason: "clerk_already_linked" };
  }
  const existingWix = input.store.getByWix(input.wix.memberId);
  if (existingWix && !existingWix.revokedAtMs) {
    return { ok: false, reason: "wix_already_linked" };
  }

  const link: LinkRecord = {
    linkId: randomBytes(16).toString("hex"),
    clerkIssuer: input.clerk.issuer.trim(),
    clerkSubject: input.clerk.subject.trim(),
    wixMemberId: input.wix.memberId.trim(),
    createdAtMs: input.nowMs ?? Date.now(),
  };
  input.store.put(link);
  return { ok: true, link };
}

/** CSRF / binding state for the dual-proof ceremony (short-lived). */
export function createLinkCeremonyState(secret: string, payload: {
  clerkSubject: string;
  wixMemberId: string;
  expMs: number;
}): string {
  const body = Buffer.from(
    JSON.stringify({
      c: payload.clerkSubject,
      w: payload.wixMemberId,
      e: payload.expMs,
    }),
    "utf8",
  ).toString("base64url");
  const mac = createHash("sha256").update(`${secret}.${body}`).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyLinkCeremonyState(
  secret: string,
  state: string,
  nowMs: number,
): { ok: true; clerkSubject: string; wixMemberId: string } | { ok: false; reason: string } {
  const parts = state.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed_state" };
  const [body, mac] = parts;
  const expected = createHash("sha256").update(`${secret}.${body}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "state_mac_invalid" };
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      c?: unknown;
      w?: unknown;
      e?: unknown;
    };
    if (!nonempty(parsed.c) || !nonempty(parsed.w) || typeof parsed.e !== "number") {
      return { ok: false, reason: "state_payload_invalid" };
    }
    if (parsed.e <= nowMs) return { ok: false, reason: "state_expired" };
    return { ok: true, clerkSubject: parsed.c, wixMemberId: parsed.w };
  } catch {
    return { ok: false, reason: "state_parse_failed" };
  }
}
