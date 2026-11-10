/**
 * Portal helper for Stage 1 verified AD.iD links (Wix navigation only).
 * Implementation lives in packages/wix-integration — Clerk remains the IdP.
 */

import {
  STAGE1_BUTTON_HINT,
  STAGE1_BUTTON_LABEL,
  buildVerifiedAdidSignInLink,
  type ApprovedAdidHost,
} from "../packages/wix-integration/src/index.ts";

import { adidFlags } from "./feature-flags.ts";

export { STAGE1_BUTTON_HINT, STAGE1_BUTTON_LABEL };

function approvedHostsFromEnv(): ApprovedAdidHost[] {
  const raw = process.env.ADID_APPROVED_HOSTS ?? "";
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
    .map((hostname) => ({ hostname }));
}

export function portalStage1SignInLink(requestedHost: string) {
  if (!adidFlags.wixPublicLinkEnabled()) {
    return { ok: false as const, reason: "ADID_WIX_PUBLIC_LINK_ENABLED is false" };
  }
  return buildVerifiedAdidSignInLink({
    approvedHosts: approvedHostsFromEnv(),
    requestedHost,
  });
}
