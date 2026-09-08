# Worker Screening Regulatory Frame

## Status

**In development / default off.** This frame establishes MapAble's worker-screening domain, jurisdiction adapter boundary, admin-only query API, and accessible review UI. It does not provide a public worker-clearance lookup and does not enable live government API calls.

## Purpose

Separate four different regulatory concepts that must not be collapsed into one "registered" state:

1. **Worker screening status** — individual worker clearance/status from an authorised NDIS Worker Screening Database or State/Territory Worker Screening Unit pathway.
2. **Provider registration** — organisation/provider registration status from NDIS Commission/official provider sources.
3. **Compliance and enforcement** — public Commission enforcement/compliance actions.
4. **Reportable incidents** — incident obligations and authorised incident records; absence of public records is not evidence that no incidents exist.

Provider registration must never be used as proof that an individual worker holds a valid clearance.

## Canonical worker screening states

MapAble normalises authoritative evidence into:

- `clearance`
- `pending`
- `interim_bar`
- `exclusion`
- `suspension`
- `no_valid_clearance`
- `unable_to_verify`

Only a current `clearance` from an authoritative NDIS Worker Screening Database or State/Territory Worker Screening Unit source may satisfy the worker-screening gate.

## Current authoritative workflow

The NDIS Commission states that State/Territory Worker Screening Units assess applications and are the main point of contact for application status and current check details. Once a worker is linked to an authorised provider or participant, the NDIS Worker Screening Database provides the current worker status.

Current NWSD statuses used by MapAble are:

- Clearance
- Pending
- Interim bar
- Exclusion
- Suspension
- No valid clearance

A linked worker's clearance can expire or change, so a previously observed clearance must not be treated as permanently valid.

## Architecture

```text
Minimal or detailed query
        |
        v
WorkerScreeningQuery
        |
        v
Admin-only query service/API
        |
        v
Jurisdiction registry
        |
        +---- VIC -> VictoriaWorkerScreeningProvider
        |
        +---- NSW/QLD/SA/WA/TAS/ACT/NT -> pathway/provider slots
        |
        v
WorkerScreeningEvidence
        |
        v
assessWorkerScreening()
        |
        +---- authoritative current clearance -> cleared evidence
        |
        +---- any other/unknown -> fail closed + human review
```

The provider layer is intentionally independent from UI and Prisma so future authenticated connectors can be added without rewriting the participant/provider experience.

## Admin query frame

The first MapAble query surface is intentionally restricted to administrators:

- UI: `/admin/workforce-screening`
- API: `POST /api/admin/workforce/screening/query`

The query accepts as little or as much information as is available:

- worker name
- Worker Screening ID or application ID
- date of birth
- jurisdiction
- employer/provider name
- employer ABN

The API does not echo DOB or raw worker identifiers in its report. It returns a status assessment, reason codes, connector readiness, official verification pathway, and checked time.

If a connector is unavailable or not configured, the result is `unable_to_verify`; the service never guesses.

## Official State/Territory pathways

MapAble maintains a current routing table derived from the NDIS Commission worker-screening guidance:

| Jurisdiction | Worker Screening Unit | Official pathway |
|---|---|---|
| ACT | Access Canberra | `https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people` |
| NSW | Office of the Children's Guardian | `https://ocg.nsw.gov.au/ndiswc` |
| NT | SAFE NT | `https://forms.pfes.nt.gov.au/safent/` |
| QLD | Disability Worker Screening Queensland | `https://www.workerscreening.qld.gov.au/` |
| SA | Department of Human Services Screening Unit | `https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks` |
| TAS | Department of Justice - Registration to Work with Vulnerable People | `https://www.justice.tas.gov.au/rwvp` |
| VIC | Department of Justice and Community Safety | `https://www.vic.gov.au/ndis-worker-screening-check` |
| WA | Department of Communities | `https://www.wa.gov.au/organisation/department-of-communities/ndis-worker-screening-check` |

National guidance: `https://www.ndiscommission.gov.au/workforce/worker-screening`.

## Victoria

Victoria publishes a **Worker Screening Status API v1.0.0** in the Victorian developer catalogue for singular and bulk status checks.

Catalogue ID: `5091ad27-e7df-48b1-98d3-7947dbb95bde`.

The public API catalogue/tester confirms that the API is published and REST-based, but it does not expose enough contract detail to safely hard-code the live host, base path, request fields, response schema, or authentication mechanism.

The current MapAble adapter therefore:

- reserves provider ID `vic_worker_screening_status_api`;
- exposes single and bulk status capabilities;
- supports fail-closed configuration;
- reports `liveTransportEnabled: false`;
- rejects live queries until the authenticated API definition is reviewed and implemented;
- requires every future response to be validated and normalised before entering MapAble.

Do not invent endpoint paths or copy credentials into source control.

## Environment

All new flags are fail closed:

```env
MAPABLE_WORKER_SCREENING_QUERY_ENABLED=false
MAPABLE_WORKER_SCREENING_VIC_ENABLED=false
WORKER_SCREENING_VIC_BASE_URL=
WORKER_SCREENING_VIC_API_KEY=
```

The API key name is a MapAble configuration placeholder only. Confirm the actual Victorian authentication scheme from the authenticated API definition before implementing transport.

## Future jurisdiction adapters

Add adapters behind the same `WorkerScreeningProvider` interface for NSW, QLD, SA, WA, TAS, ACT and NT when an authorised machine interface or formal integration pathway is available.

Where no API exists, retain a `pathway_only` state and direct users/operators to the relevant State/Territory Worker Screening Unit or authorised NDIS Worker Screening Database workflow.

## Work-on-application caution

Current NDIS Commission guidance distinguishes jurisdictions that may permit work on application in defined circumstances from jurisdictions that do not. Do not infer eligibility to work from `pending` alone. The canonical worker-screening assessment remains fail-closed; any exception workflow must be separately modelled, evidenced, jurisdiction-aware, and human-reviewed.

## Provider registration and enforcement

MapAble already ingests the public NDIS provider finder export for directory search. That dataset is a directory input and is **not** a legal guarantee of current registration.

Future regulatory reports should combine, but never conflate:

```text
worker screening evidence
+
provider registration evidence
+
public enforcement/compliance evidence
+
authorised incident evidence (when lawfully available)
```

Each evidence block must preserve source, checked time and limitations.

## Reportable incidents

Do not create a public "incident score" for workers.

The NDIS Commission's reportable-incident framework is an obligation/notification system, not a public individual worker incident register. Future polling may monitor:

- current reportable-incident categories and notification guidance;
- published Commission compliance/enforcement actions;
- provider registration changes;
- authorised internal incident records where the user has permission.

Never interpret "no public enforcement result" as "no reportable incidents" or "safe worker".

## Integration with workforce matching

`assessWorkerScreening()` should be used as a hard evidence gate before a worker can be presented as screening-cleared for regulated work.

The existing generic `evaluateWorkforceEvidence()` remains useful for qualifications and credentials, but worker screening status has its own stricter regulatory state machine and authoritative-source requirement.

## Accessibility and rights

The admin UI:

- works without a map;
- uses labelled native form controls;
- exposes status in text rather than colour alone;
- exposes source/pathway and checked date in text;
- provides a human verification pathway;
- does not display DOB in the result;
- does not make automated allegations or adverse employment decisions from ambiguous/public-only evidence.

Future participant/provider-facing UI must maintain these boundaries and meet WCAG 2.2 AA.

## Next implementation slice

After the authenticated Victorian API contract is available:

1. capture the exact Swagger/OpenAPI contract;
2. replace placeholder transport configuration with the documented authentication scheme;
3. add Zod request/response schemas;
4. implement server-only transport with timeout and bounded retry policy;
5. add response mapping tests from de-identified fixtures;
6. add audit events without logging sensitive identifiers;
7. add rate limiting and abuse controls;
8. keep provider registration and public enforcement searches separate;
9. enable the Victoria connector only after privacy/security and integration review.
