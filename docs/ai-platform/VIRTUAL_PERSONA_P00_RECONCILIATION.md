# P00 — MapAble Virtual Persona architecture reconciliation

**Mode:** documentation and synthetic contracts only (no runtime / schema / flag enablement in Phase 1)  
**Inspection:** 2026-11-06 (Australia/Sydney)  
**Canonical inspection repo:** `ausdisau/MapAble` @ `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0`  
**This change train repo:** `ausdisau/mapableau-new` (docs live at `docs/ai-platform/**`)  
**Related open drafts on MapAble:** [#21](https://github.com/ausdisau/MapAble/pull/21) (contracts baseline), [#22](https://github.com/ausdisau/MapAble/pull/22) (shadow RAG — blocked)  
**Verdict:** **Conditional GO for Phase 1 docs/contracts only.** **NO-GO** for runtime, retrieval, delegated private access, model calls, production flags, or self-applying RBAC.

## Purpose

Architect the next-generation MapAble Virtual Persona using existing AURA, MAIRA, AgentRun, and MapAble Core infrastructure. Preserve participant decision authority, AAC, and non-AI alternatives. Self-learning RBAC may propose improvements only; humans apply grants and revocations.

## Pack gap

Exact pack paths `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/RIGHTS_SECURITY.md`, and `prompts/P00_RECONCILE_READ_ONLY.md` were not present on `main`. This reconciliation is grounded in [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md) (W-AA-1), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`AUTHORITY_MODEL.md`](./AUTHORITY_MODEL.md), [`AURA_HARNESS.md`](./AURA_HARNESS.md), CareOS authority / Adaptive Access rights docs, and PR #21/#22.

## Product shape

Virtual Persona is the **AURA × MAIRA Care & Support Perceptual Frame** surface:

- MAIRA proposes interpretations (Structured Outputs; `actionAuthority: "none"`)
- AURA harness + programme execution-gate bound risk and HITL
- MapAble Core owns identity, consent, authority, and deterministic execution
- Participants decide; AAC and non-AI paths remain available

## Reuse inventory (do not fork)

| Domain | Path |
|--------|------|
| Identity / session | `lib/auth/current-user.ts` |
| Org membership | `lib/api/organisation-scope.ts` |
| Consent SoT | `lib/consent/consent-service.ts`, `ConsentRecord` |
| Purpose-aware pattern | `lib/ai/navigator/consent-gate.ts` |
| Authority (prefer identity writer) | `lib/authority/participant-authority-service.ts` |
| AURA risk / HITL | `lib/aura-harness/**` |
| Execution ceiling | `lib/programmes/aura/execution-gate.ts` |
| Agent evidence | `lib/ai/agent-ops/agent-run-service.ts` |
| Trust Fabric | `lib/config/trust-fabric.ts` |
| Authority ceilings | `lib/ai/platform/types/authority.ts` |
| RBAC proposals only | `lib/auth/keycloak/keycloak-role-mapper.ts` |
| Phase 1 contracts | `docs/ai-platform/perceptual-frame/**` |

**Do not resurrect:** `lib/aura/` Agent OS; second consent/authority SoT; generalising `hybrid.ts` to private support RAG; self-learning grant/revoke engines.

## Conflicts requiring correction before runtime

| ID | Conflict | Required correction |
|----|----------|---------------------|
| C1 | `checkConsent()` ignores `purpose` / `dataScope` / `sourceAction` | Shared exact-purpose AI consent helper; no second table |
| C2 | Dual `ParticipantAuthorityGrant` writers | Single write/evaluate path; delegated private retrieval stays disabled |
| C3 | Stop AURA is process-local only | Durable cross-instance stop + index invalidation on revoke |
| C4 | Org membership ≠ participant tenancy | Canonical participant-owned tenant model |
| C5 | AURA memory can short-circuit live checks | Memory never replaces live consent/authority/stop/tenancy |
| C6 | No purpose-specific AI consent UX | Fail closed until approved UX; keep non-AI alternative |
| C7 | Retrieval path outside W-AA-1 enumeration | Narrow formal waiver **or** keep PR #22 unmerged |
| C8 | Self-learning RBAC risk | Propose only; humans apply grants/revocations |

## Phase 1 scope (this change train)

**In scope:** synthetic perceptual-frame schemas, examples, offline fixture tests; honesty cross-links; CI job for `verify-fixtures.mjs`.

**Out of scope:** PR #22 care-support RAG; enabling AURA or care-support flags; authority writer merge; durable Stop AURA; consent UX; self-learning RBAC that writes grants/revocations.

## Tests, accessibility, rollback

```bash
node --test docs/ai-platform/perceptual-frame/tests/verify-fixtures.mjs
```

CI: `.github/workflows/perceptual-frame-contract.yml`.

Accessibility (WCAG 2.2 AA, AAC/switch/screen-reader, non-AI path, no timed auto-confirm) is required before any later participant-facing pilot — not a blocker for docs-only landing.

**Rollback:** revert this docs/contracts/CI commit; no runtime behaviour change.

## Freeze waiver and human approvals

| Item | Status |
|------|--------|
| Global FEATURE_FREEZE | Active |
| W-AA-1 | Covers Phase 1 **docs/schemas/offline tests** under related `docs/ai-platform/**` |
| PR #22 retrieval path | Outside original W-AA-1 path list — needs new narrow waiver before merge |
| Self-learning RBAC auto grant/revoke | Not authorised |
| Stack policy | Keep VP train as Phase 1 contracts alone; do not stack PR #22 |

## Related artefacts

- Contracts: [`perceptual-frame/README.md`](./perceptual-frame/README.md)
- Prior autonomy reconciliation: [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)
- Freeze: [`FEATURE_FREEZE.md`](../remediation/FEATURE_FREEZE.md)
