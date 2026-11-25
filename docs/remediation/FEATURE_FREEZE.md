# Remediation — Feature Freeze

Temporary stabilisation policy for the MapAble remediation programme.

**Status:** active from PR 1 merge until programme Definition of Done (see remediation plan) or explicit executive lift.  
**Last verified:** 2026-07-27 (`main` @ `dd5ff9fc`)

## Frozen (not permitted)

- New Prisma domains unrelated to canonicalisation or an **explicit narrow waiver** below
- New top-level `lib/*` “operating systems” or platform layers outside waived paths
- New AI agents or agent marketplaces
- New external integrations (except completing gated adapters already in tree)
- New public production claims
- New payment paths
- New consent systems (second SoT)
- New transport booking models (second SoT)
- New invoice models (second SoT)
- Speculative civic / OS / marketplace verticals
- Silent public route changes without compatibility redirects
- Pricing or financial behaviour changes without tests and migration notes
- Enabling real NDIA claim submission, autonomous safeguarding decisions, autonomous worker/driver assignment, or automatic payments/invoice approval
- Deepening any open stack beyond **three** unmerged PRs

## Permitted during remediation

- Security fixes
- Accessibility fixes
- Test coverage
- Observability (no new external vendor during freeze without owner approval)
- Canonicalisation and migrations required for it
- Documentation corrections and readiness evidence ledgers
- Production configuration hardening
- Bug fixes
- Dead-code removal after proof of non-use
- Compatibility redirects
- Release engineering (CI, CODEOWNERS, branch protection docs, runbooks)
- Repair of existing open waived product PRs **without expanding scope**

## Capability introduction rule

No new capability may be added until its domain owner, source of truth, production state, security boundary, human-review boundary, test evidence, and public-claim status are explicit (see `DOMAIN_OWNERSHIP.md`, `CAPABILITY_INVENTORY.md`, and capability registry).

All capability flags must default **false** (`=== "true"` to enable).

## Narrow freeze waivers (explicit)

Waivers do **not** lift the global freeze. Flags stay default-false. No production enable. No clinical / emergency / registration claims.

| Waiver ID | PR / branch                                                                       | Domain path                                                                                                                                                                                            | Notes                                                                                                                                                                        | Status                                                                 |
| --------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| W-AT-1    | #382 `cursor/ndis-expansion-wave1-at-continuity-0a20`                             | `lib/platform/at-continuity/**`                                                                                                                                                                        | Wave 1 AT Continuity scaffold only; additive migration; human-approved notifications                                                                                         | Active waiver; PR CI currently `FAILED`                                |
| W-GEO-0   | #367 Geoscape Predictive                                                          | `lib/geoscape-predictive/**`                                                                                                                                                                           | Address autocomplete adapters; flag default false                                                                                                                            | Active; stack parent                                                   |
| W-GEO-1   | #384–#386 (stacked)                                                               | `lib/spatial/**` (+ related)                                                                                                                                                                           | Address intelligence / approach / service areas — **stack depth 4 violates policy**; no further stack growth                                                                 | Active but **stack-policy breach**                                     |
| W-VA-1    | #383 VisionAccess contracts                                                       | vision-access contracts / synthetic lens                                                                                                                                                               | No camera/inference/migrations                                                                                                                                               | Active; review vs freeze each revision                                 |
| W-PBS-7   | #379 PBS foundation                                                               | Non-canonical `lib/positive-behaviour-support/**`                                                                                                                                                      | **Not accepted as Wave 7 owner path**; canonical remains `lib/pbs-operations/**`                                                                                             | Waiver **rejected / blocked** pending recreate                         |
| W-AA-1    | `cursor/autonomy-assurance-prompt-0-59aa` (+ Train A/B/C)                         | `lib/ai/platform/capabilities/**` (ARC sidecar), `lib/aura-harness/**`, `lib/trust/fabric/**`, `lib/act/handoff/**`, related docs/tests                                                                | Autonomy Assurance programme — deepen Trust Fabric + AURA harness; flags default false; see explicit waiver below                                                            | Active for Prompt 0 docs; product prompts require this waiver          |
| W-ACS-0   | #670 `cursor/autonomy-care-stage0-83a9` + #672 `cursor/acs-stage-0-evidence-17d4` | `docs/ai-platform/AUTONOMY_ENVELOPE_STAGE_0.md`, `docs/ai-platform/acs/**`, `lib/autonomy/envelope.ts`, `lib/consent/exact-purpose-check.ts`, `tests/autonomy/stage0-evidence.test.ts`, `tests/acs/**` | ACS Stage 0 (6 Nov 2026 paper) — docs, types, unwired exact-purpose helper, synthetic tests; no live agents, no consent SoT replacement, no production `checkConsent` change | Active for Stage 0 docs/tests; Stage 1 requires a **separate** W-ACS-1 |

**Virtual Persona Phase 1 (docs only):** synthetic AURA × MAIRA perceptual-frame contracts under `docs/ai-platform/perceptual-frame/**` plus P00 reconciliation notes sit inside the existing W-AA-1 **documentation/testing** scope (related `docs/ai-platform/**`). No path expansion into `lib/ai/platform/retrieval/**`, no runtime agents, no Prisma, no flag enablement. Shadow RAG (MapAble draft PR #22) remains **outside** the original W-AA-1 path enumeration and needs a **separate narrow waiver** before merge. See [`VIRTUAL_PERSONA_P00_RECONCILIATION.md`](../ai-platform/VIRTUAL_PERSONA_P00_RECONCILIATION.md).

**Virtual Persona P02 (synthetic UI only):** flag-gated text-first workspace under `lib/virtual-persona/**`, `components/virtual-persona/**`, `app/(marketing)/virtual-persona/**`, and related tests/docs. `MAPABLE_VIRTUAL_PERSONA_UI` defaults **false**. No live model, RAG, AgentRun, payments, bookings, consent writes, or permission grants. P01 PEP is not assumed; protected retrieval remains out of scope. This does **not** authorise a new AI agent marketplace or production enablement. See [`docs/ai-platform/virtual-persona/P02_ACCESSIBLE_TEXT_FIRST.md`](../ai-platform/virtual-persona/P02_ACCESSIBLE_TEXT_FIRST.md).

**Autonomous Care & Support Stage 0 (docs only — W-ACS-0 draft):** evidence map, exact test plan, narrow waiver draft, and reviewable Stage 1 diff proposal under [`docs/ai-platform/autonomous-care-support/**`](../ai-platform/autonomous-care-support/). Sits inside W-AA-1 documentation/testing scope for related `docs/ai-platform/**`. Optional `tests/autonomous-care-support/**` may use `describe.skip` / `it.todo` skeletons only. Does **not** waive shadow RAG, durable Stop AURA implementation, consent migrations, Temporal Cloud, Redis-as-consent, physical/clinical control, or any flag enablement. Promote from draft only with human signature — see [`WAIVER_DRAFT_ACS_STAGE0.md`](../ai-platform/autonomous-care-support/WAIVER_DRAFT_ACS_STAGE0.md).

## Honesty labels

Demo, mock, scaffold, and pilot behaviour must be labelled honestly in UI, API, and docs. Feature flags are not assurance.

## Explicit domain waiver — AT Continuity (Wave 1)

**Authorised:** NDIS Expansion Wave 1 after migrate-from-zero green (#381) and Wave 0 docs (#380) on `main`.

| Field        | Value                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain       | Assistive Technology Continuity only                                                                                                             |
| Paths        | `lib/platform/at-continuity/**`, `lib/config/at-continuity.ts`                                                                                   |
| Schema       | Additive `at_*` tables / enums in `20260720120000_at_continuity_wave1`                                                                           |
| Flag         | `MAPABLE_AT_CONTINUITY_ENABLED` remains default **false**                                                                                        |
| Still frozen | New OS layers, payments, second consent/audit, NDIA submit, auto payment approval, other NDIS Expansion product domains without their own waiver |
| Non-goals    | Clinical suitability SoT; emergency dispatch; marketplace taxonomy as asset register                                                             |
| Rollback     | Flag off; revert Wave 1 migration on non-prod if required                                                                                        |

This waiver does **not** lift the freeze globally.

## Explicit domain waiver — AI Autonomy Assurance (W-AA-1)

**Authorised:** after Prompt 0 reconciliation
([`docs/ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](../ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md))
against `main` @ `dd5ff9fc`. Extends existing Trust Fabric and AURA harness; does **not** create a new top-level OS.

| Field        | Value                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain       | AI Autonomy Assurance (TrustX ARC sidecar, AURA v2 shadow, Dignity of Risk, Decision Passport projection, A2H hardening, evidence choreography)                                                                                                    |
| Paths        | `lib/ai/platform/capabilities/**` (ARC sidecar), `lib/aura-harness/**`, `lib/trust/fabric/**`, `lib/act/handoff/**`, `intelligence/actions/**` (Governed Envelope v2 attachment), related `docs/ai-platform/**` / `docs/productisation/**` / tests |
| Schema       | Additive only under those domains; no second consent/authority SoT tables disguised as wallets or delegation ledgers                                                                                                                               |
| Flags        | All new/changed capability flags remain default **false** (`=== "true"` to enable); Trust Fabric permanent denials stay hard-coded off                                                                                                             |
| Public claim | `internal_alpha` / `not_claimable` — no public production claims                                                                                                                                                                                   |
| Stack        | Fresh Train A / B / C stacks, each ≤ **3** unmerged product PRs; do **not** deepen Geoscape W-GEO-1 or other breached stacks                                                                                                                       |
| Still frozen | `lib/aura/` Agent OS; new AI agent marketplaces; second consent SoT; AI decision authority; automatic authority; autonomous payments/claims/safeguarding/assignment/restrictive practice/capacity inference                                        |
| Non-goals    | Wholesale merge of #299 / #311; RightsOS Decision Room; Decision Passport as legal delegation wallet; averaging away critical ARC dimensions; AURA memory replacing live consent/authority/stop checks                                             |
| Rollback     | Flags off; revert additive migrations on non-prod if required; Trust Fabric + harness return to prior default-off behaviour                                                                                                                        |

**Permanent prohibitions under this waiver:** no autonomous funding/claim/invoice/payment approval; support reduction; worker or driver assignment; worker suspension or punishment; clinical or behaviour-support decisions; restrictive-practice approval; safeguarding findings; consent alteration; capacity inference; mental-state inference from voice, face, gait, or behavioural telemetry.

This waiver does **not** lift the freeze globally.

## Explicit domain waiver — Autonomous Care & Support Stage 0 (W-ACS-0)

**Authorised:** Stage 0 evidence against `main` following the 6 November 2026 ALLOW WITH SAFEGUARDS decision (Decision 5). Covers the #670 envelope map plus the #672 paper pack. Documentation, types, an **unwired** exact-purpose helper, and synthetic tests only. Does **not** expand W-AA-1 product paths.

| Field        | Value                                                                                                                                                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain       | Autonomous Care & Support Stage 0 (governance / evidence)                                                                                                                                                                                                                                            |
| Paths        | `docs/ai-platform/AUTONOMY_ENVELOPE_STAGE_0.md`, `docs/ai-platform/acs/**`, `docs/remediation/FEATURE_FREEZE.md`, `lib/autonomy/envelope.ts`, `lib/consent/exact-purpose-check.ts`, `tests/autonomy/stage0-evidence.test.ts`, `tests/acs/**`                                                         |
| Schema       | **None**                                                                                                                                                                                                                                                                                             |
| Flags        | None added; existing AI/agent flags remain default **false**                                                                                                                                                                                                                                         |
| Public claim | `internal_alpha` / `not_claimable` — no production autonomy, care or TGA claims                                                                                                                                                                                                                      |
| Stack        | Do **not** attach MapAble #22 or deepen W-GEO-1                                                                                                                                                                                                                                                      |
| Still frozen | Live AgentRun/Temporal execution; ParticipantRAG on private data; durable Stop implementation; changing production `checkConsent()`; second consent SoT; `lib/aura/` Agent OS; physical/clinical device control; payments; capacity inference; PEP/Stop runtime (needs **W-ACS-1**, not issued here) |
| Non-goals    | L3–L5 product; unattended workflows; production migrations; live data; merging MapAble PR #22                                                                                                                                                                                                        |
| Rollback     | Revert the docs/tests commit(s); no schema or flag cutover                                                                                                                                                                                                                                           |

**Permanent prohibitions under this waiver:** no autonomous funding/claim/invoice/payment approval; worker or driver assignment; clinical or behaviour-support decisions; restrictive-practice approval; safeguarding findings; consent alteration; capacity inference from disability, silence, AAC delay or communication style; LLM-only physical care.

This waiver does **not** lift the freeze globally. W-AA-1 remains the Autonomy Assurance product waiver. Stage 1 (deterministic trust) needs its own waiver after Stage 0 sign-off.
