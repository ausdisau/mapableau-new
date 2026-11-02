# Adtunis–MapAble privacy and threat-model notes

## Legal framing

- Designed for Australian Privacy Act 1988 (Cth) / APP alignment at the product-control level.
- HIPAA applicability is assessed separately and is **not** assumed for this Australian disability-services context.
- Demo consent toggles do **not** authorise real cross-border transfers or research sharing.

## Assets

- Participant transcription candidates and confirmed expressions
- Optional audio (process-only by default)
- Communication preferences and AAC phrases
- Delivery metadata (conversation id, delivery mode)

## Threats and controls

| Threat | Control |
|---|---|
| Competing identity (Clerk vs NextAuth) | Clerk not introduced; NextAuth session only |
| Cross-participant workspace read | Workspace keyed by authenticated MapAble user id |
| Unconfirmed ASR → irreversible action | Confirm gate; intent-confirmations require explicit confirm + idempotency |
| Prompt injection via transcription | Transcription treated as untrusted text; never auto-authorises clinical/safeguarding/care-plan decisions |
| Audio upload to public cloud | Fail-closed self-hosted private endpoint gate; Model Lab mock |
| Disability disclosure to employers | Jobs integrations not auto-enabled; employer field filters retained in passport policy |
| Secret leakage | No ASR tokens in client bundles or logs |
| Retention creep | Audio retention defaults process-only; separate consent + approval env |

## Data residency

No AU cloud-region allowlist was supplied with Adtunis. Vendor routing remains deny-by-default until an authoritative policy is provided.
