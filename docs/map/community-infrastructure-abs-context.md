# ABS statistical context for community infrastructure

**Review date:** 28 November 2026, Australia/Sydney.

**Status:** Verified documentation and dated saved ABS metadata; proposed analysis only. No observations, population counts, geographic join or live ABS layer were imported.

## Decision and current state

ABS area statistics could help MapAble identify places where better infrastructure evidence and participant consultation deserve attention. They cannot establish whether a particular person needs a parking space, toilet or accessible path.

The current [community infrastructure layer](community-infrastructure.md) contains source-reported OSM features in three town-centre rectangles. Keep that public facility contract unchanged. A future ABS context view should retain its own statistical geography, reference period, measure and provenance and link to infrastructure through a reviewed geographic analysis. It must not attach an area's characteristics to individuals or give a facility a demographic accessibility score.

## Inspected API contract and current documentation

The user supplied [DataAPI.openapi.yaml](https://raw.githubusercontent.com/apigovau/api-descriptions/master/abs/DataAPI.openapi.yaml). The exact file was retrieved and parsed successfully during this review. The findings below distinguish its contract from the current [ABS Data API guide](https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide).

| Evidence          | Verified finding                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supplied YAML     | Swagger `2.0`; `info.version: 0.2.0`; HTTPS host `data.api.abs.gov.au`. Four GET paths cover data and agency/latest/versioned metadata. Responses have string schemas; `definitions` is empty.                                                                                                    |
| Data endpoint     | `/rest/data/{dataflowIdentifier}/{dataKey}`; XML, SDMX JSON and CSV are advertised. Agency/dataflow/version identify a dataset; the ordered, case-sensitive key selects dimensions.                                                                                                               |
| Documented limit  | YAML prose specifies a 260-character `dataKey` maximum and HTTP 400 when exceeded. This limit was not exercised against the live service. The inspected specification gives no numeric request-rate quota or observation-count ceiling.                                                           |
| Contract mismatch | YAML format prose says `csvwithlabels`, while its enum says `csvfilewithlabels`. Its enum lacks the current guide's `format=csv`; it also omits the guide's first/last-observation and update-since parameters. Treat these as documentation differences requiring a bounded compatibility check. |
| Current ABS guide | SDMX 2.1; base `https://data.api.abs.gov.au/rest/`; XML default, JSON/CSV options, including labelled CSV via `Accept`. API keys were removed on 29 November 2024. Beta availability and currency are not guaranteed.                                                                             |

Swagger version, API-description version, SDMX version and an individual dataflow's version describe different things. None establishes the observation year. Do not generate a complete statistical response parser from the YAML's generic string response schema.

The [Using the API guide](https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide/using-api) describes metadata discovery, positional keys, `+` alternatives and wildcard dimensions. It warns that requesting `all` can produce large responses and time out. Proposed retrieval should inspect the data structure and codelists first, then request a small explicit selection. Preserve labels, units, missing values and any observation flags; an empty cell is not zero.

## Verified candidate dataflow and retrieval provenance

The ABS connector's read-only search and description identified this candidate:

| Item                         | Observed metadata                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Agency/dataflow/version      | `ABS,C21_G18_LGA,1.0.0`                                                                                                           |
| Title and coverage           | Census 2021, G18 Core activity need for assistance by age by sex; Local Government Area, **2021 boundaries**.                     |
| Referenced structure         | `ABS:C21_G18_LGA(1.0.0)`                                                                                                          |
| Key dimension order          | `SEXP`, `AGEP`, `ASSNP`, `REGION`, `REGION_TYPE`, `STATE`                                                                         |
| Separate components          | `TIME_PERIOD` time dimension; `OBS_VALUE` measure. No attributes were listed in this returned structure.                          |
| Relevant codelists           | `CL_C21_SEXP01`, `CL_C21_AGEP01`, `CL_C21_ASSNP01`, `CL_LGA_2021`, `CL_REGION_TYPE`, `CL_STATE`, all reported at version `1.0.0`. |
| Retrieval mode               | **`saved_abs_response`**, after the connector's live attempts returned HTTP 403. This is not a successful live upstream read.     |
| Original catalogue retrieval | `2026-11-28T07:52:28Z` (18:52:28 AEDT).                                                                                           |
| Original structure retrieval | `2026-11-28T07:52:42Z` (18:52:42 AEDT). The connector served the saved response later; that does not refresh the source.          |

Reproducible metadata targets:

- [Dataflow catalogue](https://data.api.abs.gov.au/rest/dataflow/ABS?detail=allstubs).
- [Versioned candidate and referenced structure](https://data.api.abs.gov.au/rest/dataflow/ABS/C21_G18_LGA/1.0.0?references=datastructure).

Direct web retrieval of the latter was also unavailable in this review. Candidate availability is supported by the connector's dated metadata, not a verified current observation query. Codes, valid combinations, units and observations still need inspection before any calculation. No query key or numerical result is asserted here. Choosing this 2021 candidate does not assert it is the latest available Census product.

## What the measure can and cannot mean

The [2021 ASSNP dictionary](https://www.abs.gov.au/census/guide-census-data/census-dictionary/2021/variables-topic/disability-and-carers/core-activity-need-assistance-assnp) concerns profound or severe core-activity limitation: assistance with self-care, mobility or communication because of a long-term condition, disability or old age. It distinguishes need for assistance, no such need, not stated and overseas visitors. ABS says the Survey of Disability, Ageing and Carers provides the comprehensive disability measure; this abbreviated Census concept does not capture the whole disability population.

Therefore a proposed area measure should be named **“2021 Census core activity need for assistance”**, with its denominator explicitly specified. It must not be labelled “all disability prevalence”, “wheelchair demand” or “people requiring an accessible toilet”. Preserve not-stated information; do not silently count it as no need. The 2021 dictionary is deliberately used to match the candidate's period.

ABS [2021 Census processing guidance](https://www.abs.gov.au/census/guide-census-data/census-methodology/2021/how-data-processed) explains perturbation, including possible differences between component sums and published totals, and the greater interpretation risk of small cells. Use published totals where available and review small-area ratios before display.

**Proposed inference:** an area with a relevant population context and poorly documented infrastructure may warrant an access audit and community discussion. It is not evidence of an infrastructure shortage, personal need, facility use, unmet demand or a causal relationship. Missing OSM records can indicate missing mapping, and current study-window records are not a complete inventory.

## Geographic join and architecture gates

The rectangles in [community configuration](../../lib/access/community-infrastructure/config.ts) are not ABS LGAs or SA2s. Do not divide their facility counts by whole-LGA population counts, assign an LGA total to a rectangle or allocate population by simple land-area overlap.

ABS provides [2021 boundary downloads](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files). A future analysis should explicitly select the matching boundary release, codes and coordinate reference system; its [current geography guidance](https://www.abs.gov.au/statistics/statistical-geography/using-statistical-geography) also distinguishes later editions. Retain the 2021 statistical period alongside the infrastructure observation/retrieval dates.

| Gate and owner                                   | Required evidence before implementation                                                                                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Measure: analyst and participant representatives | Agreed question, numerator, denominator, residence basis, inclusion of not-stated categories, intended interpretation and limits.                                                        |
| Retrieval: data maintainer                       | Inspected codes and constraints, bounded observation response, exact version/key/period, source URL, original retrieval date, response hash and live/saved mode.                         |
| Join: geospatial maintainer                      | Boundary edition and CRS verified; joins use codes rather than names; duplicate and unmatched records reviewed; infrastructure coverage made comparable or clearly disclosed as partial. |
| Interpretation: human review                     | Separate mapping gaps from provision gaps; address time mismatch and visitors travelling across boundaries; avoid person-level or causal conclusions.                                    |
| Publication: product and accessibility leads     | Optional area-context view with an equivalent keyboard/screen-reader table, clear units and dates, no colour-only meaning and no universal accessibility ranking.                        |

## Privacy, permissions, tests and recovery

Use public aggregates only. No personal disability profile, household address, movement history or health record is needed; participant research requires its own consent. Do not attempt to reconstruct people from small cells. ABS [copyright guidance](https://www.abs.gov.au/website-privacy-copyright-and-disclaimer) provides CC BY 4.0 for website material with specified exceptions. Retain applicable product/boundary terms and attribution separately from the OSM-derived layer's ODbL attribution.

Proposed deterministic tests should reject wrong key ordering, geography-year mismatches, duplicate joins, missing denominators and unsupported codes. They should preserve zero versus missing, not-stated categories and source flags, and avoid forcing perturbed totals to match component sums. Security controls should bound upstream requests and validate response shape before publication.

On retrieval failure, retain the last approved dated aggregate and expose its staleness, or show context unavailable. Never replace a failed response with zero. Keep an audit trail and a rollback path for any future adapter; its failure must not prevent facility discovery. This document changes no runtime behaviour. The strict MapAble technical validator checks this brief's structure and controls; it does not validate statistical estimates or establish a live integration.
