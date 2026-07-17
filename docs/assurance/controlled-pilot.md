# Controlled pilot

Controlled pilot design for post-assurance validation — never auto-activated in Wave 6.

## Model

`ControlledPilot`:

- `autoActivateForbidden` defaults to `true`
- Requires linked `ProductionGoLiveAssessment`
- Status workflow: `draft` → approved activation (manual only)

## Policy

`lib/assurance/go-live/pilot-policy.ts` — pilots are never auto-activated by feature flags or readiness decisions.

## Readiness decision

`ready_for_controlled_pilot` means internal gates allow **considering** a pilot — not activating one.

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Controlled pilots are not production go-live and do not imply NDIA approval.
