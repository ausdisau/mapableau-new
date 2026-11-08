# MapAbleID schema proposal notes (v0.3)

**Status:** Review only — not applied.

## Relationship to existing Prisma models

| Proposed table | Existing nearest model | Guidance |
|---|---|---|
| `identity_subject_links` | `IdentityProviderLink`, `AuthIdentityLink` | Prefer verified issuer+subject; do not email-merge |
| `identity_service_entitlements` | none (catalogue planned) | Required before AD.iD federation |
| `identity_delegation_grants` | `ParticipantAuthorityGrant`, `DelegateInvitation` | v0.3 reads existing grants; new table is additive later |
| `identity_consent_receipts` | `ConsentRecord`, `ConsentReceipt` | Avoid duplicate write paths until cutover plan |
| `identity_security_events` | `LoginAuditEvent`, `AuditEvent` | Keep details scrubbed (no secrets/NDIS) |
| `identity_recovery_requests` | password-reset token flow (no model) | Human-assisted path must not imply family takeover |

## Constraints

- Do not modify `neon_auth.*`.
- No automatic account linking by shared email.
- Apply only on isolated empty/schema-only Neon after owner approval.
- Never copy production personal data into development.
