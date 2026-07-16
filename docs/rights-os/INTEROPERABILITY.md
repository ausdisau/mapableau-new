# Interoperability

RightsOS composes with existing MapAble modules and branch-pending work without duplicating consent storage or identity.

## Reused platform primitives

| Primitive | RightsOS usage |
| --------- | -------------- |
| `User` | Subject, requester, supporter identities |
| `ConsentRecord` | Legacy consent via `consent-record-adapter.ts` |
| `AuditEvent` | All rights actions (`rights.*` prefix) |
| `AccessibilityProfile` | Field source for access and jobs purposes |

## Branch-pending composition

- **Trust Kernel / AuthorityGrant** — capability leases reference authority records when enforcement is on; no duplicate grant store.
- **Access Intelligence** — `access.verify_venue` aligns with AccessPassport merge from `cursor/access-intelligence-module-4b25`.
- **CareOS** — `care.worker_handover` uses shift-bound fields; mission SoR conflict documented in Wave 0.

## External presentation

| Format | Status |
| ------ | ------ |
| Secure link capsule | Implemented |
| QR / printable card | Implemented (fallback) |
| Verifiable Credentials | Deferred unless pilot requires |

## Adapter pattern

`lib/rights-os/adapters/consent-record-adapter.ts` maps PRMS consent scopes to purpose codes for dual-read migration. Retirement timeline TBD after shadow period.

## API consumers

Programme services should call `enforcePurposeIfEnabled()` rather than reading registry JSON directly. Shadow mode returns `enforced: false` so existing `checkConsent` paths remain authoritative.

## Related

- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
