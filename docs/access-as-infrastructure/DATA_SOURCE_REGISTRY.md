# MapAble Accessibility Data Fabric — Data Source Registry

**Status:** proposed implementation foundation; no production ingestion is enabled by this document.

## Purpose

The data-source registry is the admission and provenance boundary for external evidence used by MapAble Access.

It is deliberately separate from:

- the canonical Access Graph (`lib/access/infrastructure/**`), which stores and presents access observations;
- runtime provider registries such as the Access Integration Gateway proposed in PR #563, which register adapter implementations; and
- participant profile / consent systems, which govern personal information rather than bulk external datasets.

A source being listed in this registry does **not** mean it is currently ingested, complete, current, endorsed by its publisher, or independently verified by MapAble.

## Constitutional data zones

MapAble uses three data classes.

### `OPEN_EVIDENCE`

Public or openly reusable evidence about environments, services, systems or aggregate rights outcomes.

Examples in the initial registry include:

- Australian Human Rights Commission published disability-rights statistics;
- AHRC Disability Discrimination Act Action Plan Register;
- National Public Toilet Map;
- OpenStreetMap;
- portal-level records for AIHW, NDIA and Transport for NSW datasets that remain blocked until the exact dataset reuse terms are registered.

Open does not mean licence-free. Attribution, licence, source record, retrieval time and provenance remain mandatory where required.

### `CONTROLLED_RESEARCH`

Governed research assets that must remain within their approved research environments.

The initial registry includes:

- ABS Person Level Integrated Data Asset (PLIDA);
- AIHW National Health Data Hub (NHDH).

MapAble must not ingest controlled-research microdata into its operational systems. Only disclosure-cleared aggregate findings from an approved project may cross the research firewall, and those findings require their own source/provenance record before publication or downstream use.

Controlled research findings must never be joined to MapAble user IDs, participant profiles, care records, trip histories or other person-level operational data.

### `PARTICIPANT_CONTROLLED`

Purpose-bound personal information provided or authorised by a participant, such as access and communication preferences.

This information belongs in MapAble's consent-governed participant systems. It is explicitly excluded from the bulk external dataset ingestion pipeline.

## Admission rule

`evaluateOperationalIngestion()` fails closed when:

1. the source is controlled research;
2. the data is participant-controlled personal information;
3. the registry entry represents a portal whose child datasets have dataset-specific reuse terms that have not yet been registered;
4. operational ingestion is not explicitly enabled for the source;
5. required licence metadata is absent; or
6. required attribution text is absent.

This permits a connector to exist in code without implying that MapAble is legally or operationally entitled to import every dataset available through that connector.

## Portal versus dataset records

A government portal is not itself sufficient evidence of reuse rights for every dataset it hosts.

For sources such as Transport for NSW Open Data, NDIS public datasets and AIHW reporting, the generic portal record remains `operationalImport: false` and `requiresDatasetLevelLicence: true` until the specific child dataset used by an adapter has been reviewed and registered with its own terms.

Adapters should therefore depend on a future dataset-specific registry entry such as:

```text
transport-for-nsw-interchange-facilities
```

rather than treating:

```text
transport-for-nsw-open-data
```

as blanket permission for ingestion.

## AHRC boundary

Published AHRC rights statistics can support aggregate rights indicators and a rights taxonomy where reuse terms permit it.

They must not be used to:

- map individual complainants;
- infer the identity of a complainant;
- treat complaint frequency as the prevalence of discrimination;
- declare that an organisation breached the Disability Discrimination Act; or
- convert an AHRC-registered Disability Action Plan into an AHRC endorsement or MapAble accessibility certification.

MapAble may describe an observed barrier and its rights relevance. Legal breach determinations remain outside the automated mapping layer.

## Research firewall

The required flow for NDDA-enabled controlled research is:

```text
PLIDA / NHDH
    |
approved secure research environment
    |
analysis + disclosure review
    |
cleared aggregate output
    |
MapAble research-finding provenance record
    |
Rights / Outcomes Observatory
```

The prohibited flow is:

```text
PLIDA / NHDH microdata
    X
MapAble operational database
    X
participant-level scoring, eligibility or clinical prediction
```

## Provenance envelope

Every imported external assertion should be able to carry at least:

- `dataSourceId`;
- publisher/source record identifier;
- source URI;
- retrieval time;
- observation time where known;
- SHA-256 content hash;
- licence identifier where applicable;
- required attribution;
- verification state;
- confidence where used; and
- whether the assertion was machine-derived.

Machine-derived evidence cannot self-promote to `INDEPENDENTLY_VERIFIED`.

This complements the existing Access Graph rule that AI-inferred evidence must never appear as independently verified fact.

## Conflict preservation

Imports must not silently overwrite contrary evidence.

The registry foundation distinguishes:

- `CREATE` — new observation/evidence;
- `DUPLICATE` — same source record and same content hash;
- `SUPERSEDE` — same source record changed upstream;
- `CONFLICT` — another source asserts a different value for the same claim.

A conflict is evidence to expose and resolve, not an instruction to discard the older or less authoritative record automatically.

## Relationship to PR #563

PR #563 introduces a runtime Access Integration Gateway and adapter-neutral provenance vocabulary. When that work is reconciled with `main`, adapters should use this data-source registry as the **admission/licensing layer** before normalising evidence through the gateway.

The responsibilities remain distinct:

```text
Data-source registry
    -> may this exact source/dataset be used, and under what terms?

Integration provider registry
    -> which adapter implementation handles it?

Access Graph
    -> how is the resulting observation represented, aged, disputed and shown?
```

Do not merge the concepts into one mutable global registry.

## Initial implementation non-goals

This slice does not:

- create a database migration;
- download or ingest any external dataset;
- enable a production feature flag;
- create PLIDA, NHDH or NDDA research access;
- store research microdata;
- create an AHRC legal-compliance determination;
- claim current coverage of any geography; or
- resolve licensing questions for portal-level datasets whose exact child resource has not been selected.

## Next vertical slice

Recommended next step after review and CI:

1. add durable `DataSourceRecord` / ingestion-run persistence without duplicating `AccessObservationRecord`;
2. register one exact child dataset with verified reuse terms;
3. build a single idempotent adapter;
4. emit ordinary Access Graph observations with source IDs and content hashes;
5. demonstrate duplicate and conflicting-source behaviour; and
6. keep the adapter disabled until an explicit operational activation decision.

The National Public Toilet Map is a suitable first candidate because it is narrowly scoped and already represented as an explicitly licensed open source in the registry.
