# Personal Access Vault — Current State

**Branch baseline:** implemented on `cursor/personal-access-vault-registry-77ea` against `main`.

## On main before this work

| Capability | Status |
| ---------- | ------ |
| Civic export/deletion requests | `PersonalDataVaultRequest` + `/data-vault` |
| Consent | `ConsentRecord` |
| Accessibility prefs | `AccessibilityProfile` |
| Audit | `AuditEvent` |
| Passkeys / Twilio 2FA | Present |
| Visit plan shares | `VisitPlan` / `VisitPlanShare` |
| Worker trust credentials | Pilot |
| Access Passport / AURA Memory / Capsules | Unmerged feature branches |

## Delivered in this implementation

| Wave | Deliverable | Flag default |
| ---- | ----------- | ------------ |
| 0 | Inventory docs + frozen taxonomy + Canonical Data Router | N/A (code always present) |
| 1 | Reference-only `PersonalVault` / `VaultItem` + Nutrition Labels + `/vault` UI | `MAPABLE_*` false |
| 2 | Participant Vault Ledger projection over `AuditEvent` | ledger flag false |
| 3 | `VaultDevice` enrolment / revoke / lost + local offline policy stub | device flags false |
| 4–5 | Shadow capability broker + purpose-aware disclosure compiler | capability flags false |
| 6–7 | Envelope metadata scaffold, recovery/export/import/deletion honesty APIs | crypto/recovery/export flags false |
| 8–9 | Programme enforce flags + private-matching / confidential-compute / external-provider lab stubs | all false |

## Explicit non-claims

- No production KMS keys created
- No Access Passport migration into Vault editable copies
- No Capsule issuance domain duplication
- No enforcement of Vault for essential services
- Custodial encryption path is **not** end-to-end
