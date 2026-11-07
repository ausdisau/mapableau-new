/**
 * Stage 0 skeletons only — Autonomous Care & Support.
 *
 * These cases document Stage 1 trust requirements from
 * docs/ai-platform/autonomous-care-support/STAGE0_TEST_PLAN.md.
 * They must remain skipped until Stage 1 implements shared purpose
 * consent, durable Stop AURA, and cross-tenant deny. Do not "green"
 * them with stubs that bypass the consent SoT.
 */

import { describe, it } from "vitest";

describe.skip("ACS Stage 0 → Stage 1 trust contracts (not implemented)", () => {
  it.todo(
    "N1/N2: cross-tenant private roster/consent read denied before retrieval",
  );
  it.todo(
    "N3/N11: revoked consent pauses next protected action; stale cache never approves",
  );
  it.todo(
    "N4/N5: purpose mismatch and dataScope over-read denied at shared SoT",
  );
  it.todo("N6: client-supplied role/tenant claim rejected");
  it.todo("N7: durable Stop AURA visible across instances");
  it.todo(
    "N8: AAC delay / silence treated as communication access failure, not incapacity",
  );
  it.todo(
    "N9: hallucinated eligibility/care need stays proposal-only (actionAuthority none)",
  );
  it.todo("N10: idempotent retry does not duplicate contact or payment");
  it.todo("N13: standing exclusion (do not contact family) enforced");
  it.todo("N14: clinical/physical red-line tools hard-refused");
  it.todo("P2/P4: L1 draft under review; exact-purpose roster projection only");
});
