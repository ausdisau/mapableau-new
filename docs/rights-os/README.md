# MapAble Rights Operating System (RightsOS)

RightsOS is the participant-authority, purpose-control, supported decision-making and selective-disclosure layer for the MapAble ecosystem.

## Pillars

1. **Purpose Firewall** — deterministic runtime policy engine (`lib/rights-os/policy-evaluator.ts`)
2. **Personal Access Vault** — participant-controlled sensitive information index (`lib/rights-os/vault/`)
3. **Supported Decision Room** — decision support without substitution (`lib/rights-os/decision-room/`)
4. **Access Capsules** — expiring selective disclosure (`lib/rights-os/capsules/`)
5. **Recipient Obligations** — duty tracking and receipts (`lib/rights-os/duties/`)
6. **Participant Rights Centre** — `/rights` routes
7. **Rights Ledger** — participant-readable audit replay (`lib/rights-os/ledger/`)

## Operating modes

| Mode | Behaviour |
|------|-----------|
| `demo` | Synthetic people and policies; no external disclosure |
| `shadow` | Evaluates and logs; does not block production flows |
| `supervised` | Enforces selected high-risk purposes with human review |
| `production` | Purpose-by-purpose activation |

## Feature flags

See `lib/rights-os/config.ts` and `.env.example` (`MAPABLE_RIGHTSOS_*`).

## Documentation

- [CURRENT_STATE.md](./CURRENT_STATE.md) — Wave 0 inventory and merge plan
- [ARCHITECTURE.md](./ARCHITECTURE.md) — hybrid capability broker design
- [PURPOSE_FIREWALL.md](./PURPOSE_FIREWALL.md) — policy engine details
- [PERSONAL_ACCESS_VAULT.md](./PERSONAL_ACCESS_VAULT.md) — encrypted vault index
- [DECISION_ROOM.md](./DECISION_ROOM.md) — supported decision flow
- [ACCESS_CAPSULES.md](./ACCESS_CAPSULES.md) — selective disclosure packages
- [RECIPIENT_OBLIGATIONS.md](./RECIPIENT_OBLIGATIONS.md) — duties and attestation
- [POLICY_LANGUAGE.md](./POLICY_LANGUAGE.md) — registry and reason codes
- [INTEROPERABILITY.md](./INTEROPERABILITY.md) — platform composition
- [THREAT_MODEL.md](./THREAT_MODEL.md) — threats and mitigations
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — Rights Centre accessibility
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) — partner pilot operations
- [ROLLBACK.md](./ROLLBACK.md) — disable and rollback procedures

## Non-goals

RightsOS is not a legal-capacity assessment, clinical decision system, disability identity card, blockchain requirement, universal government identity, automatic consent generator, or replacement for MapAble authentication.
