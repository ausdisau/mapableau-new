# Wave 0 — Repository Reconciliation

**Programme:** MAPABLE CONNECTED CAPABILITY PROGRAMME  
**Public positioning:** Care and support, connected.  
**Base:** `main` @ post-#306 (Access Intelligence Next Waves 4–5)

## Purpose

Establish current-state inventory, canonical domains, PR topology, migration order, shared contracts, and non-goals before product slices land.

## Preconditions (controls)

- PR #300 remediation / CI gates — **merged** (reuse)
- PR #302 ConvergenceOS — **merged** (advisory control plane)
- Permanent deny flags remain hard-false in Connected Capability config
- Do not merge mega-stack tips (#298–#309) onto `main` without rebase + migration renumber

## Open PR actions (human merge train)

| PR | Action |
|----|--------|
| #279 Shared programme foundation | Land early after **renumbering** migration (clash with #280 `20260716120000_*`) |
| #281 Personal Access Vault | Land before RightsOS |
| #280 RightsOS | Land after Vault; do not redefine vault |
| #308 Living Access Fabric | Continue AI train; supersedes #291 |
| #289 / #290 | Close — superseded by #302 |
| #235 Academy MVP | Rebase onto Academy completion-evidence contracts |
| #299 AURA | One AURA train only — consolidate vs #267–#277 |

Connected Capability Wave 1 **does not require** #279 DDL — Zod contracts and AccessibilityProfile projection are sufficient.

## Shared spine delivered in-repo

| Module | Path |
|--------|------|
| Feature flags | `lib/config/connected-capability-flags.ts` |
| Evidence classes | `lib/connected-capability/evidence.ts` |
| Universal Handoff | `lib/connected-capability/handoff.ts` |
| Shared contracts | `lib/connected-capability/contracts.ts` |

## Non-goals (programme-wide)

No second identity, consent, worker, provider, mission, incident, or audit platform.  
No opaque scores. No automatic worker assignment, clinical competency, equipment prescription, safeguarding, or NDIS claiming.  
No WebView-as-Companion. No regional auto-assignment. No unrestricted partner participant data.  
AI may not hold operational authority.

## Exit criteria

- [x] Inventory documented
- [x] Shared contracts defined once
- [x] Flags default off with permanent denies
- [x] Wave 1 may proceed without waiting for #279 merge
