# RightsOS Architecture

## Recommended design: Hybrid Capability Broker

MapAble stores canonical operational records (consent, audit, missions) centrally. Sensitive reusable data lives in an encrypted participant vault index. RightsOS issues short-lived capability leases and Access Capsules for selective disclosure.

```
Participant → Rights Centre → Purpose Firewall → ConsentRecord / Lease → Domain Module
                                    ↓
                              AuditEvent / Rights Ledger
```

## Trust boundaries

1. **Participant** — approves consequential disclosure
2. **RightsOS policy** — deterministic; AI explains only
3. **Authority** — ConsentRecord durable; RightsCapabilityLease ephemeral
4. **Domain modules** — must evaluate before field access
5. **Recipients** — duties attested, not guaranteed

## Canonical reuse

- `User`, `Organisation`, `OrganisationMember` — identity and tenancy
- `ConsentRecord` — legal/operational authority foundation
- `AuditEvent` — audit foundation
- `AccessibilityProfile` — presentation preferences
- `PersonalDataVaultRequest` — export/deletion workflow adapter

RightsOS does not create a second authentication, consent database, or audit system.
