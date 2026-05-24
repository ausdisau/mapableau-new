# ABN verification (Provider and Worker)

MapAble integrates with the Australian Business Register (ABR) **ABN Lookup web services**, following the official [ABN Lookup sample code](https://github.com/ABN-SFLookupTechnicalSupport/ABNLookupSampleCode) HTTP GET RPC pattern.

## Register for a GUID

1. Register at [ABR Web Services](https://abr.business.gov.au/Tools/WebServices).
2. Set `ABR_LOOKUP_GUID` in your environment.
3. Set `ABR_LOOKUP_ADAPTER_MODE=http` for live lookups (defaults to `mock` for local dev).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `ABR_LOOKUP_GUID` | (empty) | Authentication GUID from ABR |
| `ABR_LOOKUP_ADAPTER_MODE` | `mock` | `mock` or `http` |
| `ABR_LOOKUP_AUTO_RUN_ON_SUBMIT` | `true` | Run ABN check when submitting a verification case |
| `ABR_NAME_MATCH_THRESHOLD` | `0.75` | Minimum name similarity score (0–1) |
| `ABR_LOOKUP_TIMEOUT_MS` | `30000` | HTTP timeout for live ABR calls |

## Mock ABNs (development)

| ABN | Scenario |
|-----|----------|
| `53004085616` | Active entity, name matches demo org |
| `99000000032` | Cancelled entity |
| `51824753556` | Active entity, name mismatch |

## API routes

- `POST /api/verification/abn/lookup` — lookup ABN (requires `verification:manage:org`)
- `PATCH /api/verification/organisations/[organisationId]/abn` — save organisation ABN
- `POST /api/provider-verification/cases` — create case (optional `runAbnCheck`, `submit`)
- `POST /api/provider-verification/cases/[caseId]/run-abn-check`
- `POST /api/provider-verification/cases/[caseId]/submit`
- `POST /api/admin/provider-verification/cases/[caseId]/decide` — admin decision
- `POST /api/workers/[workerId]/verification/run` — worker credential + contractor ABN checks

## UI

- `/dashboard/verification` — provider ABN lookup and verification case
- `/provider/onboarding` — onboarding ABN step
- Admin organisation and worker pages show automated check results

Automated ABN checks are **evidence only**; admins still decide final provider verification status.
