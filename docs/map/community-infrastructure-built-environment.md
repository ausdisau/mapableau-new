# Built-environment evidence for the community infrastructure layer

**Review date:** 28 November 2026, Australia/Sydney.

**Status:** Verified live primary-source research; proposed evidence schema and delivery gates. No building inspection, professional compliance assessment or runtime schema change was performed for this brief.

## Decision and participant outcome

Keep a source-reported access attribute, a measured physical characteristic and a professional assessment as separate evidence. A participant needs to understand the doorway, transfer space or approach they would actually use, together with its date and limitations. A general wheelchair tag cannot answer all of those questions.

The proposed next step is a small, professionally reviewed measurement pilot connected to the existing GAIS evidence contract. It should support informed facility discovery without assigning an overall legal-compliance score or promising that every participant can use a facility.

## Current implementation and scope

The current [community layer](community-infrastructure.md) projects public OSM records into GAIS-derived GeoJSON for three fixed study windows. Its [types](../../lib/access/community-infrastructure/types.ts) preserve source identity, dates, raw tags, reported wheelchair status and geometry role. The [normalizer](../../lib/access/community-infrastructure/normalise.ts) labels width and incline as source tags; an approximate centre is not an entrance. It does not determine a building's classification, applicable approvals, statutory exceptions or compliance pathway.

The supplied [Classic Architectural Group article](https://classic-arch.com/articles/accessibility-compliance-for-public-buildings-australia/), dated 18 May 2026, identifies entrances, toilets, circulation and wayfinding as topics. It is commercial explanatory material, not the authority for legal rules or a reusable facility dataset. Its broad statements about building coverage and possible exemptions require the more specific checks below. Its quantified usability claim was not substantiated by the official sources reviewed.

## Evidence ledger: fact, inference and unknown

| Status                                       | Evidence and scope                                                                                                                                                                                                                                                                                                      | Consequence for MapAble                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Verified live: federal framework**         | DDA section 4 defines premises broadly, including places whether enclosed or built on. Section 23 addresses discriminatory access to premises open to the public or a section of it. The observed compilation is C2026C00456, 8 October 2026. [B1](#b1-disability-discrimination-act)                                   | A park or footpath can raise access questions without being a building. Do not equate the scope of the DDA with the scope of a building-code checklist.          |
| **Verified live: Premises Standards scope**  | Section 2.1 specifies building classes, new buildings, new/affected parts and existing public-transport buildings. Relevant approval/construction triggers use 1 May 2011. Class 2 coverage and exclusions need particular attention. Observed compilation: F2024C01272, 23 November 2024. [B2](#b2-premises-standards) | Facility category alone cannot establish applicability. A park's toilet building and its surrounding open space need separate subjects and evidence.             |
| **Verified live: affected part**             | Section 2.1(5) includes the principal pedestrian entrance and the necessary path from it to the new part. [B2](#b2-premises-standards)                                                                                                                                                                                  | Assessments must identify the entrance and path considered; a toilet record cannot establish the whole journey.                                                  |
| **Verified live: NSW edition**               | NSW identifies NCC 2022 Amendment 2 as current, effective 29 July 2025, and NCC 2025 adoption on 1 May 2027. NSW variations and approval circumstances matter. [B3](#b3-nsw-application-and-current-edition)                                                                                                            | Record jurisdiction, approval context and applicable edition. Do not select an edition solely because it is the latest published NCC.                            |
| **Verified live: referenced standards**      | ABCB Amendment 2 replaces the AS 1428.1:2009 reference with AS 1428.1:2021. [B4](#b4-abcb-amendment) The Premises Access Code's A3.1 still references AS 1428.1:2001 for specified H2 transport provisions and AS/NZS 2890.6:2009 for D3.5 parking. [B2](#b2-premises-standards)                                        | A standard identifier without edition, clause and application context is insufficient. A newly published standard is not automatically the incorporated edition. |
| **Verified live: assessment pathways**       | NSW describes Deemed-to-Satisfy, Performance Solution and combined pathways for meeting relevant Performance Requirements. [B3](#b3-nsw-application-and-current-edition)                                                                                                                                                | A single dimension check cannot represent the assessment of an entire building or an accepted Performance Solution.                                              |
| **Verified live: exceptions are contextual** | Premises Standards section 4.1 considers heritage significance among unjustifiable-hardship factors and requires compliance to the extent hardship does not arise. [B2](#b2-premises-standards)                                                                                                                         | Never derive an exemption from an OSM heritage tag, building age, size or an operator's unsupported assertion.                                                   |
| **Inference: evidence design**               | The different subjects, dates and pathways above require scoped evidence rather than a universal pass/fail label.                                                                                                                                                                                                       | Proposed schema and gates below are engineering decisions, not additional legal requirements.                                                                    |
| **Unknown: individual facilities**           | This work obtained no site measurements, building-classification records, approval files, approved Performance Solutions or current equipment inspections.                                                                                                                                                              | Existing OSM features remain source-reported. No facility receives a compliance finding or an inference of noncompliance from missing data.                      |

This ledger is a technical evidence brief, not legal advice or a determination about a building. The official sources support the stated distinctions; a qualified reviewer must assess any actual site and the law applicable to it.

## Proposed architecture and data model

Retain the existing public `GET /api/access/community-infrastructure` contract during this stage. Design future measurements and assessments as evidence attached to stable GAIS feature/place identifiers, with explicit sub-assets for an entrance, bay, cubicle or path. Avoid a second competing facility database or verification vocabulary.

The following are **proposed fields**, not fields already available from the API. Names are illustrative and require agreement with GAIS maintainers before implementation.

| Evidence group           | Proposed information                                                                                                                                        | Interpretation boundary                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Subject                  | `assetId`, `parentAssetId`, `buildingPart`, `storey`, `geometryRole`, geometry accuracy and source                                                          | Site centre, entrance, off-street bay, on-street bay, cubicle and path segment are distinct subjects.                                       |
| Applicability            | Jurisdiction; evidenced building class/use; relevant work and application dates; scope of new/affected parts; applicability reviewer and record             | Unknown class or work history stays unknown. Do not derive a legal class from a venue name.                                                 |
| Rule basis               | Instrument identifier/compilation; NCC volume/edition/amendment; jurisdictional variation; standard edition and clause; assessment date                     | Keep the rule used at assessment time, even when a newer edition is later published.                                                        |
| Measurement              | Metric, numeric value, unit, observation method, instrument/accuracy, location within asset, orientation, observer and `observedAt`                         | Raw OSM strings are reported tags. A measurement has a defined method and scope. Record uncertainty; avoid false precision.                 |
| Assessment               | Named assessor and relevant competence; report reference; design review versus site inspection; pathway; criteria assessed; scoped findings and limitations | An assessor's documented finding remains attributed. Do not turn it into MapAble certification or an assessment of uninspected assets.      |
| Exception or alternative | Claimed basis, supporting decision/report, decision-maker, exact area/requirement, conditions and dates                                                     | Preserve an unsupported claim as a claim; it is not an accepted exception.                                                                  |
| Operations               | Entrance restrictions, key requirements, hours, equipment status and temporary obstruction, each with check time and review/expiry policy                   | Enduring geometry and current availability are separate. No live vacancy, open-now or functioning-hoist claim from a historical inspection. |
| Provenance               | Original source values, source identifier/URL, release and retrieval dates, observation date, publication rights and review audit trail                     | Retrieval time never substitutes for observation time. Conflicting observations remain available to human review.                           |

Use existing GAIS source and review semantics. Within a future measurement, distinguish `observed`, `reported`, `not_measured`, `unknown` and `conflicting` information without overwriting the original evidence. Proposed assessment outcomes must be scoped to the assessed criterion; missing evidence must never become a negative finding.

### Proposed measurement pilot

Choose a small connected arrival-to-facility sample rather than claiming regional completeness. Access specialists and participants should agree measurement methods before collection.

| Subject                       | Candidate measurements and observations                                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parking                       | Individual bay dimensions; shared transfer area and obstructions; vertical clearance along the relevant approach; surface and slope; signs; connection to the pedestrian route. Record whether parking is on-street or off-street. |
| Path and entrance             | Clear width at constrictions; longitudinal gradient and crossfall with units and direction; kerb/threshold rise; landings and turning areas; door clear opening and operating force; assistance required; route continuity.        |
| Toilet                        | Identified cubicle; measured circulation and transfer space with an orientation diagram; door operation; fixture and grabrail positions; basin access; privacy; key/access arrangements.                                           |
| Adult change facility         | Separate claims for adjustable adult table, hoist, sling requirements, usable circulation, inspection date and operating restrictions. Retain any directory registration as its own evidence.                                      |
| Sensory and wayfinding access | Sign position and readability, tactile/Braille information, contrast measurement method, hearing augmentation and coverage, lighting conditions and hazards. Record conditions of observation.                                     |

These candidates are a participant-information design proposal, not a reproduction of an Australian Standard or an exhaustive compliance checklist. The full referenced standards and any publication rights for their contents must be obtained appropriately before encoding detailed thresholds. Treasury confirms that the Premises Standards and NCC reference Australian Standards, and distinguishes library access for non-commercial use. [B5](#b5-access-to-referenced-standards)

## Acceptance gates, owners and tests

| Gate                             | Responsible role                                                     | Acceptance evidence                                                                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Applicability review             | Access specialist with the relevant building/certification expertise | Documented jurisdiction, building/asset scope, dates, editions and pathway for each assessed sample; unresolved questions remain visible.                                                                                                                       |
| Contract convergence             | MapAble Access and GAIS maintainers                                  | Reviewed schema mapping and stable identity; source records preserved; no automatic upgrade of OSM tags to measured or professionally assessed evidence.                                                                                                        |
| Deterministic normalization      | Data maintainer                                                      | Focused tests for units, percentages versus ratios, unknown/false, conflicting observations, invalid/future dates, on/off-street context and missing applicability. A valid measurement alone must not create an overall pass.                                  |
| Participant accessibility        | Accessibility lead and participants with varied access requirements  | Keyboard and screen-reader access to measurements, units, dates and limitations; useful text equivalent for orientation diagrams; no status communicated by colour alone. Include sensory and cognitive access needs.                                           |
| Evidence permissions and privacy | Data steward and reviewer                                            | Publication rights for reports/photos; consent where people are identifiable; removal of faces, vehicle plates, personal contact details and private interior information not needed for the public record. No disability profile or movement history required. |
| Controlled publication           | Product owner and maintainers                                        | Reviewed sample only, human review of attributed findings, dated evidence and visible unknowns. Keep raw measurements separate from professional interpretation and participant suitability.                                                                    |

**Security and failure recovery:** Treat source text and uploaded evidence as untrusted input. Validate and bound imports; store reports behind appropriate access controls; publish only approved public fields. If a licence, date, applicability rule or assessment is disputed, withdraw the derived assessment and retain an audit trail. The fallback is the dated source-reported record with its limitations. A future adapter must support rollback to the last approved snapshot without changing an original observation.

**Validation boundary:** This change adds documentation only. The MapAble strict technical validator checks structure and claim controls; passing it does not establish legal correctness, building accessibility or product conformance. Runtime tests and production verification remain those documented in the [implementation overview](community-infrastructure.md). No new adapter, import, certification workflow or external contact is asserted here.

## Primary sources

### B1. Disability Discrimination Act

[Federal Register: current DDA text](https://www.legislation.gov.au/C2004A04426/latest/text). Observed compilation C2026C00456. Relevant sections: 4, 23 and 34. [Pinned text inspected](https://www.legislation.gov.au/C2004A04426/2026-10-08/2026-10-08/text/original/epub/OEBPS/document_1/document_1.html).

### B2. Premises Standards

[Federal Register: current Premises Standards](https://www.legislation.gov.au/F2010L00668/latest/text). Observed compilation F2024C01272. Relevant provisions: 2.1, 3.2, 4.1 and Schedule 1 A3.1. [Pinned text inspected](https://www.legislation.gov.au/F2010L00668/2024-11-23/2024-11-23/text/original/epub/OEBPS/document_1/document_1.html).

### B3. NSW application and current edition

[NSW Government: How to comply with the National Construction Code](https://www.nsw.gov.au/housing-and-construction/compliance-and-regulation/how-to-comply-national-construction-code), updated 13 May 2026. Recheck adoption and project-specific transition rules before any future assessment.

### B4. ABCB amendment

[ABCB: NCC 2022 Amendment 2](https://www.abcb.gov.au/sites/default/files/resources/2025/NCC%202022%20Amdt%202_0.pdf), version 1.0, released 28 July 2025 and effective 29 July 2025. This is the amendment text, not the entire NCC or AS 1428.1.

### B5. Access to referenced standards

[Australian Treasury: Premises Standards](https://treasury.gov.au/policy-topics/housing/building-and-construction/premises-standards). Use the legislation for detailed scope; this page supplies policy context and standards-access information.

Related work: [Australian source register](community-infrastructure-sources.md), [platform adaptations](community-infrastructure-platforms.md), and [GAIS convergence](../architecture/gais-convergence.md).
