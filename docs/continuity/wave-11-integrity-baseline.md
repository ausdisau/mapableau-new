# Wave 11 — Integrity baseline

Wave 11 preserves every constraint added by Waves 2–10:

- **Case (Wave 8)** remains the source of truth for casework. `ContinuityCase` is a projection and optionally links via `linkedCaseId`.
- **Consent-v2, disclosure gateway, wallet, delegation (Wave 9)** unchanged. Continuity communications are gated by channel consent; participant-data egress still routes through `discloseParticipantData`.
- **AURA safety envelope (Wave 10)** unchanged. New `service_recovery` specialist inherits `NEVER_APPROVE` prohibitions and adds emergency-service prohibitions.
- **Tenant scoping (Wave 8)** unchanged. Every continuity query is organisation-scoped or fails closed.
- **Invoice/billing approvals (Wave 4-5)** unchanged. `FINANCIAL_PROHIBITED_ACTION_SLUGS` centralises the guardrail.

Wave 11 audit scripts (`continuity:audit-*`) exist specifically to detect any regression against this baseline.
