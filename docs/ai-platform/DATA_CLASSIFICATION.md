# Data classification

Classes: public, operational, participant_pii, health_sensitive, financial, safeguarding, credentials_secrets, legal_privileged.

Output provenance must distinguish confirmed_fact, participant_report, provider_report, worker_note, system_record, model_inference, unresolved_conflict, missing_information, stale_information, disputed_information.

Missing evidence must never become a positive conclusion.

## Processing sensitivity (derived)

The Unified Guardian derives `ProcessingSensitivity` (D0–D4) from canonical `DataClass`
values. It does **not** replace `DataClass`. See
[UNIFIED_GUARDIAN.md](./UNIFIED_GUARDIAN.md) and
`lib/ai/platform/guardian/processing-sensitivity.ts`.
