/**
 * Stage 1 ONLY — Wix Editor / Velo page code (conceptual).
 * Review against current Velo docs before pasting into production Editor.
 *
 * Docs:
 * - Unified API Reference index
 * - wix-location for navigation (not session minting)
 *
 * Do NOT call generateSessionToken or applySessionToken here.
 * Do NOT put tokens in the URL.
 *
 * Replace APPROVED_ADID_HOST after the protected preview host is verified.
 */

import wixLocation from "wix-location";

// Operator-approved AD.iD host only (no placeholders in live sites).
const APPROVED_ADID_HOST = "REPLACE_AFTER_VERIFIED_DEPLOY";

$w.onReady(() => {
  const button = $w("#adidSignInButton");
  if (!button) return;

  button.label = "Sign in to AD.iD";
  button.onClick(() => {
    // Same-window navigation; separate from Wix Members login.
    wixLocation.to(`https://${APPROVED_ADID_HOST}/sign-in`);
  });
});
