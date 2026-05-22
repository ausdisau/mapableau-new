# MapAble Core — Phase 12

Phase 12 delivers **federated institutional accountability** and completes themes from the deferred **Phase 11 preview** (national accountability portal, constitutional safeguards, community governance membership, transport investment modelling, certified API ecosystem at scale, research federation at scale).

There was no separate Phase 11 implementation branch — Phase 12 absorbs that scope plus institutional permanence (continuity plans, civic audit index, federated accountability partners).

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `national-accountability` | Published accountability reports |
| `constitutional-safeguards` | Platform safeguard articles |
| `community-governance-membership` | Public membership directory (labels only) |
| `transport-investment-modelling` | Scenario models with suppression |
| `certified-api-ecosystem` | Certified partner API listings (flag-gated) |
| `research-federation-at-scale` | Approved federation nodes (flag-gated) |
| `institutional-continuity` | Succession and continuity checkpoints |
| `civic-audit-index` | Annual civic audit publications |
| `federated-accountability` | Cross-jurisdiction partner links |

## Public routes

- `/accountability` — national accountability portal
- `/safeguards` — constitutional safeguards
- `/membership` — community governance directory
- `/investment-models` — transport investment scenarios

## Admin routes

`/admin/national-accountability`, `/admin/constitutional-safeguards`, `/admin/community-membership`, `/admin/transport-investment`, `/admin/certified-api-ecosystem`, `/admin/research-federation-nodes`, `/admin/institutional-continuity`, `/admin/civic-audit-index`, `/admin/federated-accountability`

Matching `/api/admin/*` for each.

## Feature flags

| Flag | Default |
|------|---------|
| `NATIONAL_ACCOUNTABILITY_PORTAL_ENABLED` | true |
| `CONSTITUTIONAL_SAFEGUARDS_ENABLED` | true |
| `COMMUNITY_GOVERNANCE_MEMBERSHIP_ENABLED` | true |
| `TRANSPORT_INVESTMENT_MODELLING_ENABLED` | true |
| `INSTITUTIONAL_CONTINUITY_ENABLED` | true |
| `CIVIC_AUDIT_INDEX_ENABLED` | true |
| `FEDERATED_ACCOUNTABILITY_ENABLED` | true |
| `CERTIFIED_API_ECOSYSTEM_AT_SCALE_ENABLED` | false |
| `RESEARCH_FEDERATION_AT_SCALE_ENABLED` | false |

## Limitations

- Investment models are scenarios only — not financial or government advice
- Membership directory publishes labels only — no PII
- API ecosystem and research federation require explicit flags
- Safeguards are operational principles — not legal constitutional documents

## MapAble Core phases

Phases 1–5 (baseline), 6–10 (documented in `README_MAPABLE_PHASES_6_TO_10.md`), and **Phase 12** complete the civic platform arc. Phase 11 preview items are implemented here.
