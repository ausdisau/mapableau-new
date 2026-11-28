# Healthcare public data: relevance to community infrastructure

**Status:** Proposed source assessment; no healthcare dataset integration or facility import implemented by this review.

**Reviewed:** 28 November 2026, Australia/Sydney.

## Decision and current implementation

Public hospital directories can help identify a destination. They do not, by themselves, establish usable parking, a step-free entrance, a toilet configuration or a connected route for a participant. The current [community infrastructure layer](community-infrastructure.md) remains an OSM source snapshot using existing Access/GAIS contracts. This review adds documentation only.

The requested **Healthcare Public Data** name did not resolve to a matching installed skill or callable connector in the inspected cloud/executor skill catalogs and tool registry. Relevant available capabilities were inspected instead: **CMS Open Data**, **Medicare Care Compare**, **NPI Registry** and **CMS Coverage**. These concern the US healthcare system. They are not a source authority for the Parramatta, Penrith and Blacktown study windows.

MapAble Strategy & Delivery supplies the technical evidence, ownership and claim-control workflow for this document. No private Health connector, patient information or clinical recommendation was needed.

## Available capabilities and read-only checks

| Capability            | Available public workflow                                                                                               | Work performed and relevance                                                                                                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CMS Open Data         | Curated Medicare Part B, Part D and inpatient payment/utilisation datasets; schema inspection and bounded queries.      | Called `list_curated_datasets`, then `get_curated_dataset_schema` for `inpatient_hospital_payments_by_provider_and_service`. Six curated datasets were returned. The inspected hospital schema contains CCN, organisation name, US geography, DRG, discharges and payment fields; no entrance, toilet, parking or path-access observations. |
| Medicare Care Compare | Find Medicare-participating hospitals, home-health agencies and nursing homes; retrieve dated quality/outcome measures. | Inspected the tool contracts only. Hospital search accepts US state and five-digit ZIP filters and returns CMS facility IDs. No US facility search/import was necessary for this NSW task.                                                                                                                                                  |
| NPI Registry          | Search public provider identity/taxonomy/address records and look up or validate an NPI.                                | Inspected capability descriptions only. Provider identity and a practice address do not identify a surveyed entrance or establish physical accessibility. No individual provider lookup performed.                                                                                                                                          |
| CMS Coverage          | Public US Medicare coverage determinations, analyses and updates.                                                       | Outside this facility-geography task; not queried. A coverage policy is not evidence of local physical access.                                                                                                                                                                                                                              |

The live CMS hospital schema resolved reporting year **2024**, dataset version `ca9b5ef0-1386-4759-b2b6-5f9b35116786`, modified **23 April 2026**. Its connector metadata returned `license_url: null`; that is missing licence metadata, not a conclusion that reuse is prohibited or unrestricted. Dataset links and dictionary are recorded below [S1–S2]. The reporting period, publication/update time and retrieval time describe different events.

## Australian sources examined

| Candidate                        | Geography and identity                                                                                                                                                                                                              | Rights, freshness and access limits                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AIHW MyHospitals** [S3]        | Documentation describes Australian hospital location data and reporting-unit names/codes, alongside hospital and aggregate statistics. A reporting unit can also be a geographic area; it must not automatically become a facility. | Documented v1 JSON/CSV API currently requires no authentication. JSON includes API/data versions and upload/request timestamps. The documentation does not establish entrance, toilet, parking or path measurements. Live facility payloads were not fetched. |
| **NSW Hospitals, Data.NSW** [S5] | Resource dictionary lists name, address, suburb, postcode, contacts, LHD, website and ED. It does not list a stable facility ID, coordinates or access measurements.                                                                | Resource page says licence unspecified; data last updated 21 January 2020 and metadata updated 7 December 2023. These dates do not prove current service conditions. The CSV was not imported or its runtime endpoint tested.                                 |

AIHW's current copyright page specifies **CC BY 4.0**, with exclusions and precedence for separate licences, and requires attribution without implying endorsement [S4]. Its API guide contains inconsistent older licence wording, including “BY 3.9” alongside “CC-BY 3.0” [S3]. Before publishing an extract, record the applicable dataset-specific terms and reconcile that discrepancy; do not silently choose a licence from inconsistent text. NSW's unspecified resource licence likewise remains unresolved for redistribution.

This is an assessment of inspected documentation, not an exhaustive audit of every Australian healthcare dataset. Public health-system statistics may provide planning context, but they must not be converted into a facility accessibility score or a prediction about an individual participant.

## Proposed architecture and next integration gate

Access should own any later facility identity/source association; GAIS should expose its scoped public evidence. Existing Navigate/Go responsibilities remain as described in [GAIS convergence](../architecture/gais-convergence.md). Avoid a separate healthcare accessibility authority or a duplicate participant profile.

A useful next slice would evaluate one Australian hospital identity record near a chosen study window, after resolving reuse terms. It should:

1. Preserve the source namespace, reporting-unit/facility identifier, record URL, licence, geographic scope and relevant dates. Confirm the record represents a hospital rather than an aggregate area.
2. Review campus/address matches explicitly. A similar name or nearest point is a candidate match, not an automatic merge. Record geometry provenance and role; do not invent coordinates from an address without a separately licensed, documented geocoding step.
3. Keep independently evidenced arrival, entrance, toilet and path features separate. A hospital-level service or quality indicator must not fill a missing physical-access field. Retain `unknown` and `routeEndpoint: false` until the appropriate evidence exists.
4. Obtain participant review of the information needed for the chosen arrival task, using the [research and co-design gate](community-infrastructure-research.md). This does not establish clinical suitability or recommend a healthcare provider.

These are proposed checks; no API wiring, scheduled job, cross-source merge or database change is introduced here.

## Security, privacy and accessibility assurance

Apply data minimisation to a future public adapter: allowlist facility identity and necessary environmental facts; exclude patient data, participant live location, interviews and personal contact details. Consent for any later participant study is separate from directory access and follows shared Core permissions. Public-source text remains untrusted and must be displayed as text. Human review controls identity conflicts; deterministic validation controls accepted fields and geometry.

Any later facility display should preserve the existing list alternative, keyboard and assistive-technology access, plain-language unknowns and visible evidence dates. Target **WCAG 2.2 AA**, with manual and participant evaluation in addition to automated tests. Healthcare source authority must not visually imply that MapAble has inspected the physical site.

Tests for a future adapter should cover wrong-country/aggregate-record rejection, campus ambiguity, source-version preservation, licence metadata, coordinate role and the absence of inferred access features. This documentation-only review does not require new runtime tests. The MapAble technical strict validator checks document structure, not data accuracy or participant usability.

## Failure, recovery and rollback

If rights, identity, geography or source freshness cannot be established, keep the candidate out of the public facility overlay and retain its source link for review. Do not substitute US records or fabricate an accessible route. A later failed refresh should preserve the last valid dated snapshot; rollback should disable only the optional healthcare identity enrichment. The existing OSM list/map remains available without a healthcare-data dependency.

## Source register

- **S1 — CMS hospital dataset:** [Medicare Inpatient Hospitals — by Provider and Service](https://data.cms.gov/provider-summary-by-type-of-service/medicare-inpatient-hospitals/medicare-inpatient-hospitals-by-provider-and-service). Current metadata/schema retrieved through CMS Open Data; catalogue [data.cms.gov/data.json](https://data.cms.gov/data.json).
- **S2 — CMS data dictionary:** [Medicare Inpatient Hospitals — by Provider and Service data dictionary](https://data.cms.gov/resources/medicare-inpatient-hospitals-by-provider-and-service-data-dictionary-0). Dictionary URL supplied by the connector; field list was independently returned by its live schema operation.
- **S3 — AIHW:** [MyHospitals API documentation](https://www.aihw.gov.au/hospitals/other-resources/myhospitals-api). Official page inspected, including geography, reporting units, version metadata and licence wording; application endpoints were not exercised.
- **S4 — AIHW:** [Copyright and attribution policy](https://www.aihw.gov.au/copyright). Official page inspected, including CC BY 4.0, exclusions and separate-licence precedence.
- **S5 — NSW Ministry of Health / Data.NSW:** [NSW Hospitals resource and dictionary](https://www.data.nsw.gov.au/data/en/dataset/nsw-hospitals/resource/e17840df-ecfc-4e38-b51b-9f49af5dc21a). Official metadata inspected; downloadable resource not tested or ingested.
