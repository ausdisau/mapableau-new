# Relational Intelligence — Controlled Pilot Readiness Pack (Phase 08)

**Status:** Registered, not live. All flags default false. Production enablement blocked.

## Delivery context

| Item | Value |
|---|---|
| Repository | `ausdisau/mapableau-new` (`/workspace`) |
| Branch | `cursor/agentic-nerve-centre-a99d` |
| Scope | Gap-closure on `lib/ai/platform` + `lib/ai/navigator` |
| Participant-facing name | MapAble Navigator (unchanged) |

## Capability registry

Six relational keys registered in `lib/ai/platform/capabilities/seed.ts`:

- `relational.interpret`, `relational.clarify`, `relational.explain`, `relational.draft`
- `access.search.read`, `human.help.request`

See [CURRENT_STATE.md](./CURRENT_STATE.md) for flag defaults.

## Governance evidence

| Check | Command | Expected |
|---|---|---|
| AI platform + relational governance | `pnpm test:ai-platform` | All pass |
| Navigator phases 1–5 | `pnpm exec vitest run tests/navigator` | All pass |
| Relational benchmark (synthetic) | Covered in `relational-governance.test.ts` | All pass |

## Rollback

1. Unset env flags: `MAPABLE_RELATIONAL_INTELLIGENCE_*`
2. Revert seed entries + `lib/ai/relational/**` in one commit
3. Global kill switch: `MAPABLE_AI_GLOBAL_KILL_SWITCH=true`

See [ROLLBACK.md](./ROLLBACK.md).

## Unresolved (owner decisions)

| Decision | Owner | Status |
|---|---|---|
| Canonical repo post-amalgamation (`MapAble/apps/web`) | Product / platform | Documented — build on `mapableau-new` |
| Communication Passport SoT | Platform | **Resolved:** `lib/support/communication-passport` |
| Merge Agentic Nerve Centre PR #522 | Engineering | In progress on feature branch |
| NDIS / OAIC guidance verification | Privacy / legal | Process — verify at enablement |
| Production enablement | Product + engineering | **Blocked** |

## Manual accessibility evidence

Run [scripts/manual-a11y-relational-navigator.md](../scripts/manual-a11y-relational-navigator.md) before controlled pilot with real participants.

## Related documents

- [NAVIGATOR_ASSURANCE.md](./NAVIGATOR_ASSURANCE.md)
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md)
- [AGENTIC_NERVE_CENTRE.md](./AGENTIC_NERVE_CENTRE.md)
- Relational Constitution v0.1: `lib/ai/relational/constitution.ts`

## GO / NO-GO

**NO-GO for production** until:

1. Phase 08 evidence pack reviewed by platform lead
2. Written authorisation for Prompts 09–12 (if applicable)
3. Explicit flag enablement in target environment only

**GO for controlled-pilot development** on feature branch with flags off by default.
