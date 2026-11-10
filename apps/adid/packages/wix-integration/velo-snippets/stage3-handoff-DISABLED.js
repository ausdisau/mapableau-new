/**
 * Stage 3 — DISABLED BY DEFAULT. Do not enable on Wix production.
 *
 * Official APIs (for isolated test sites only after dual-proof link + ticket):
 * - Backend: wix-members-backend authentication.generateSessionToken(email)
 *   WARNING: Wix auto-creates a member if the email is unknown. AD.iD forbids
 *   browser-supplied email and forbids allowCreateMember.
 * - Frontend: wix-members-frontend authentication.applySessionToken(sessionToken)
 * - Secrets: store any shared HMAC / API material in Wix Secrets Manager —
 *   never hard-code secrets in this file.
 *
 * This snippet is intentionally non-runnable (throws) so it cannot be pasted
 * live without deliberate operator edits and flag review.
 */

throw new Error(
  "Stage 3 Wix session handoff is disabled. Enable only after ADID_WIX_SESSION_BRIDGE_ENABLED review, dual-proof link, one-time ticket redeem, existing member check, privacy approval, and rollback plan.",
);

/*
 * Conceptual server flow (NOT production-ready):
 *
 * 1. AD.iD server redeems one-time ticket (POST body only).
 * 2. Resolve linked wixMemberId → directory email (never from browser).
 * 3. Confirm memberExists === true (else refuse — generateSessionToken would create).
 * 4. Call generateSessionToken only inside Wix backend with Secrets Manager credentials.
 * 5. Return sessionToken to page code via secure response; applySessionToken locally.
 * 6. Never put sessionToken in query strings, hashes, or localStorage from AD.iD.
 */
