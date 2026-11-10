/**
 * Stage 3 — disabled-by-default native Wix session handoff.
 *
 * Official Velo path (isolated test only, never production without review):
 * - Backend: wix-members-backend authentication.generateSessionToken(email)
 *   WARNING: Wix docs state this AUTO-CREATES a member if the email is unknown.
 *   AD.iD therefore forbids browser-supplied email and forbids calling the Wix
 *   API unless an existing linked memberId is resolved server-side and
 *   allowCreateMember is explicitly false.
 * - Frontend: wix-members-frontend authentication.applySessionToken(sessionToken)
 *   Session tokens must be delivered via POST body / secure cookie — never URL.
 *
 * Headless Sign-On similarly auto-creates/updates members — not used here for
 * Editor/Velo ausdis.com.au without separate eligibility confirmation.
 *
 * Secrets: store Wix API keys only in Wix Secrets Manager / server env —
 * never in client bundles or chat.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { wixStageFlags } from "./flags.ts";
import type { LinkRecord, LinkStore } from "./stage2-identity-link.ts";

export type HandoffTicket = {
  ticketId: string;
  /** Opaque one-time secret — never place in URLs or localStorage. */
  secret: string;
  linkId: string;
  clerkSubject: string;
  wixMemberId: string;
  expMs: number;
  consumedAtMs?: number;
};

export type HandoffStore = {
  put(ticket: HandoffTicket): void;
  consume(ticketId: string, secret: string, nowMs: number): HandoffTicket | null;
};

export function createMemoryHandoffStore(): HandoffStore {
  const tickets = new Map<string, HandoffTicket>();
  return {
    put(ticket) {
      tickets.set(ticket.ticketId, ticket);
    },
    consume(ticketId, secret, nowMs) {
      const ticket = tickets.get(ticketId);
      if (!ticket) return null;
      if (ticket.consumedAtMs) return null;
      if (ticket.expMs <= nowMs) return null;
      const a = Buffer.from(ticket.secret);
      const b = Buffer.from(secret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
      ticket.consumedAtMs = nowMs;
      return ticket;
    },
  };
}

export type MintHandoffResult =
  | { ok: true; ticketId: string; secret: string; expMs: number }
  | { ok: false; reason: string };

export type RedeemHandoffResult =
  | {
      ok: true;
      wixMemberId: string;
      /** Instruction only — actual Velo call stays in Wix backend under review. */
      delivery: "server_post_body_only";
      allowGenerateSessionToken: false | true;
      allowCreateMember: false;
    }
  | { ok: false; reason: string };

const DEFAULT_TTL_MS = 60_000;

/**
 * Mint a one-time, replay-resistant handoff ticket after verifying an active link
 * and a live Clerk session. Does not call Wix.
 */
export function mintHandoffTicket(input: {
  store: HandoffStore;
  links: LinkStore;
  clerkIssuer: string;
  clerkSubject: string;
  clerkSessionPresent: boolean;
  /** Browser-supplied email must never drive session minting. */
  browserSuppliedEmail?: string;
  ttlMs?: number;
  nowMs?: number;
}): MintHandoffResult {
  if (!wixStageFlags.sessionHandoffEnabled()) {
    return { ok: false, reason: "ADID_WIX_SESSION_BRIDGE_ENABLED is false" };
  }
  if (input.browserSuppliedEmail !== undefined) {
    return { ok: false, reason: "browser_email_session_mint_forbidden" };
  }
  if (!input.clerkSessionPresent) {
    return { ok: false, reason: "clerk_session_required" };
  }

  const link = input.links.getByClerk(input.clerkIssuer, input.clerkSubject);
  if (!link || link.revokedAtMs) {
    return { ok: false, reason: "no_active_identity_link" };
  }

  const nowMs = input.nowMs ?? Date.now();
  const ticket: HandoffTicket = {
    ticketId: randomBytes(16).toString("hex"),
    secret: randomBytes(32).toString("base64url"),
    linkId: link.linkId,
    clerkSubject: link.clerkSubject,
    wixMemberId: link.wixMemberId,
    expMs: nowMs + (input.ttlMs ?? DEFAULT_TTL_MS),
  };
  input.store.put(ticket);
  return {
    ok: true,
    ticketId: ticket.ticketId,
    secret: ticket.secret,
    expMs: ticket.expMs,
  };
}

/**
 * Redeem a handoff ticket server-side. Replay of the same ticketId+secret fails.
 * Returns authorization to proceed with a Wix-side generateSessionToken ONLY for
 * the linked member, with allowCreateMember forced false.
 */
export function redeemHandoffTicket(input: {
  store: HandoffStore;
  links: LinkStore;
  ticketId: string;
  secret: string;
  nowMs?: number;
}): RedeemHandoffResult {
  if (!wixStageFlags.sessionHandoffEnabled()) {
    return { ok: false, reason: "ADID_WIX_SESSION_BRIDGE_ENABLED is false" };
  }

  const nowMs = input.nowMs ?? Date.now();
  const ticket = input.store.consume(input.ticketId, input.secret, nowMs);
  if (!ticket) {
    return { ok: false, reason: "invalid_or_replayed_ticket" };
  }

  const link = input.links.getByWix(ticket.wixMemberId);
  if (!link || link.revokedAtMs || link.linkId !== ticket.linkId) {
    return { ok: false, reason: "link_revoked_or_missing" };
  }

  return {
    ok: true,
    wixMemberId: ticket.wixMemberId,
    delivery: "server_post_body_only",
    // generateSessionToken remains gated: operator must wire Velo separately.
    // This package never auto-creates Wix members.
    allowGenerateSessionToken: false,
    allowCreateMember: false,
  };
}

/**
 * Guard around any future call that would invoke generateSessionToken.
 * Refuses browser email and member auto-create.
 */
export function authorizeGenerateSessionTokenCall(input: {
  handoffEnabled: boolean;
  emailSource: "browser" | "linked_member_directory" | "unknown";
  memberExists: boolean;
  allowCreateMember: boolean;
  ticketRedeemed: boolean;
}): { allowed: false; reason: string } | { allowed: true } {
  if (!input.handoffEnabled) {
    return { allowed: false, reason: "ADID_WIX_SESSION_BRIDGE_ENABLED is false" };
  }
  if (!input.ticketRedeemed) {
    return { allowed: false, reason: "handoff_ticket_required" };
  }
  if (input.emailSource === "browser") {
    return { allowed: false, reason: "browser_email_forbidden" };
  }
  if (input.emailSource !== "linked_member_directory") {
    return { allowed: false, reason: "email_source_untrusted" };
  }
  if (input.allowCreateMember) {
    return { allowed: false, reason: "auto_create_member_forbidden" };
  }
  if (!input.memberExists) {
    return {
      allowed: false,
      reason: "existing_wix_member_required_generateSessionToken_would_auto_create",
    };
  }
  return { allowed: true };
}

/** Hash helper for audit logs — never log raw session tokens. */
export function hashForAudit(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function activeLinkOrUndefined(
  links: LinkStore,
  clerkIssuer: string,
  clerkSubject: string,
): LinkRecord | undefined {
  const link = links.getByClerk(clerkIssuer, clerkSubject);
  if (!link || link.revokedAtMs) return undefined;
  return link;
}
