# Worker Screening Regulatory Frame

## Status

**In development / default off.** This frame establishes MapAble's worker-screening domain and jurisdiction adapter boundary. It does not provide public worker-clearance lookup and does not enable live government API calls.

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

## Architecture

```text
Minimal or detailed query
        |
        v
WorkerScreeningQuery
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
        +---- clearance -> eligible screening evidence
        |
        +---- any other/unknown -> fail closed + human review
```

The provider layer is intentionally independent from UI and Prisma so future authenticated connectors can be added without rewriting the participant/provider experience.

## Victoria

Victoria publishes a **Worker Screening Status API v1.0.0** in the Victorian developer catalogue for single or bulk status checks.

The public API catalogue page identifies the API but does not expose enough authenticated contract detail to safely hard-code the transport, endpoint paths, request fields, response schema or credential mechanism.

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

Any future UI must:

- state what is verified and what is unknown;
- avoid colour-only status meaning;
- expose source and checked date in text;
- provide a human verification pathway;
- not publish DOB, screening identifiers or other private worker data;
- not make automated allegations or adverse employment decisions from ambiguous/public-only evidence.

## Next implementation slice

After the authenticated Victorian API contract is available:

1. capture the exact Swagger/OpenAPI contract;
2. add Zod request/response schemas;
3. implement server-only authentication;
4. add response mapping tests from fixtures;
5. add audit events without logging sensitive identifiers;
6. add rate limits/timeouts/retries;
7. keep provider registration and public enforcement searches separate;
8. expose the result only through an authenticated, permission-gated MapAble service/API.
