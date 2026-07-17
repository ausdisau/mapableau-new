# Quality & Safeguards Ops Centre — Implementation Checklist

MapAble is **not** the NDIS regulator, an approved quality auditor, a clinical authority, or a legal adviser.

## Routes

| Path | Status |
| --- | --- |
| `/admin/ops/quality-safeguards` | Wave 1 — home cockpit |
| `/admin/ops/quality-safeguards/inbox` | Wave 1 — signal triage |
| `/admin/ops/quality-safeguards/*` section pages | Wave 1 placeholders; full modules in later waves |
| `/ops/quality-safeguards/*` | Wave 1 — redirect alias to `/admin/ops/...` |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `QUALITY_SAFEGUARDS_OPS_ENABLED` | enabled unless `"false"` | Gate Ops Centre UI/API |
| `FEATURE_BEHAVIOUR_SUPPORT_GOVERNANCE` | `false` | Restrictive-practice / BSP module |
| `QUALITY_COPILOT_ENABLED` | `false` | Optional AI assistant (Wave 8) |

## Wave 1 (foundation) — done

- [x] Prisma models: signals, links, capability grants, deadline rules/instances, workflow tasks, immutable audit, regulatory profile config
- [x] Migration `20260717120000_quality_safeguards_foundation`
- [x] Permissions + org capability grants
- [x] Deadline engine (hours / business days with AU holiday stub / calendar days)
- [x] Immutable audit append API
- [x] Trust-safety queue feeder → `SafeguardSignal`
- [x] Dashboard + signals APIs
- [x] Ops Centre shell, inbox, accessibility-minded urgency labels
- [x] Fictional seed `prisma/seed-quality-safeguards.ts`
- [x] Unit tests under `tests/quality-safeguards/`

## Wave 2 — Incidents

- [ ] Immediate-response panel
- [ ] Reportability wizard + human confirmation (no auto Commission submit)
- [ ] Investigation workspace
- [ ] Export / evidence pack
- [ ] Additive `qscWorkflowStatus` mapping

## Wave 3 — Complaints & safeguarding

- [ ] Anonymous / accessible complaint intake
- [ ] Participant-visible timeline
- [ ] Narrow safeguarding case ACL
- [ ] Follow-up that never closes solely for non-response

## Wave 4 — Workforce trust

- [ ] Credential states beyond mock trust passport
- [ ] Verification queue + expiry automation
- [ ] Training / competency matrix
- [ ] Assignment eligibility advisory (no automated adverse employment action)

## Wave 5 — Quality & improvement

- [ ] Care / transport service-quality signal rules
- [ ] CAPA with effectiveness review
- [ ] Risk register
- [ ] De-identified analytics + small-cohort suppression

## Wave 6 — Audit & policy

- [ ] Obligations register + applicability wizard
- [ ] Evidence vault
- [ ] Policy lifecycle + acknowledgements

## Wave 7 — Integrations

- [ ] End-to-end Care / Transport / Jobs feeders
- [ ] Notification preference respect (no sensitive SMS bodies)
- [ ] Document storage signed links

## Wave 8 — Advanced (feature-flagged)

- [ ] Behaviour-support / restrictive-practice governance
- [ ] Quality Copilot (human review required labels)
- [ ] External auditor portal
- [ ] Board reporting packs

## Verification commands

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

### Wave 1 verification results

| Check | Result |
| --- | --- |
| Prisma schema + migration `20260717120000_quality_safeguards_foundation` | Present |
| `lib/quality-safeguards/*` services (signals, deadlines, audit, capabilities, dashboard) | Present |
| Admin Ops UI `/admin/ops/quality-safeguards` + `/ops` alias redirects | Present |
| APIs under `app/api/quality-safeguards/` | Present |
| Permissions, trust-safety feeder, peer-middleware, AdminDashboard link | Wired |
| Unit tests `tests/quality-safeguards/` + fictional seed | Present |
| `.env.example` feature flags documented | Present |

Run the verification commands above in CI or locally before merge; Wave 1 foundation is file-complete on branch `cursor/quality-safeguards-ops-b684`.

## Seed (fictional only)

```bash
npx tsx prisma/seed-quality-safeguards.ts
```
