# Community infrastructure: disability research and design implications

**Status:** Proposed research-informed acceptance criteria; the current source layer is implemented, not independently verified for participant usability or real-world access.

**Research date:** 28 November 2026, Australia/Sydney.

**Decision:** Ground the parking, toilet and public-space discovery layer in disabled people's information needs, while keeping source reports distinct from evidence that a person can complete their chosen journey.

## What the evidence supports

The selected literature supports giving people specific environmental information and control over how they use it. It also shows why a facility label, map pin or access symbol is an incomplete description of an experience. The evidence spans drivers' lived experience, urban mobility barriers, a measured building-access application, and disability-studies analyses of toilet access and accessibility [E1–E5]. These are reasons to test the present design with participants; they are not evidence that MapAble improves travel, prevents failed journeys or works for every disability.

This is a bounded, purposeful evidence scan, not a systematic review. Three PubMed records and two JSTOR articles were selected for direct relevance and inspectable evidence. One paper's full text was retrieved through the PubMed connector from PMC; the other four were assessed from complete public abstracts. No clinical intervention, health record or individual medical inference is involved.

## Evidence ledger

Access labels describe material actually inspected, not a publisher's open-access designation. A public abstract remains `ABSTRACT_INSPECTED` even when the item advertises an open licence.

| Evidence                                                                      | Population and method                                                                                                                                                                                                                                         | Supported finding or argument                                                                                                                                                                                   | Limitations and relevance                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E1 — Hutchinson et al. (2020)**. PubMed; `ABSTRACT_INSPECTED`.              | Eight drivers using modifications ranging from simple to complex; semistructured interviews and interpretative phenomenological analysis. The abstract does not establish a representative geographic sample.                                                 | Participants described complex driving choices and environmental constraints. The authors identify parking location/counts, steps, slopes and ticket-machine position/height as potentially useful information. | Small exploratory qualitative study; it does not estimate prevalence or test a mapping intervention. Supports investigation of the complete arrival task rather than a parking designation alone.                                                                      |
| **E2 — Kirchner et al. (2008)**. PubMed; `ABSTRACT_INSPECTED`.                | Nonrandom sample of 134 guide-dog, long-cane, manual-wheelchair and powered-wheelchair users; two telephone surveys in 2005–2006, with observation/interviews in a 32-person subsample.                                                                       | Broadly positive neighbourhood-access ratings coexisted with specific barriers. Participants reported route planning, changes, delays and waiting; barriers varied across mobility technologies.                | Historical, nonrepresentative urban study; its estimates are not current rates for the three NSW windows. Supports testing detailed information and alternatives across different access needs.                                                                        |
| **E3 — Mayordomo-Martínez et al. (2019)**. PubMed/PMC; `FULL_TEXT_INSPECTED`. | Field audit of 357 establishments in Murcia, Spain, over eight months; three technicians measured entrance features. App development involved a disability association; usability inspection used cognitive walkthrough and heuristic review with two raters. | The implementation recorded entrance measurements and visit dates. The discussion identifies missing sidewalk, surface and incline information as a routing limitation.                                         | Building-entry study with local classifications; expert usability inspection is not participant outcome evaluation. Its thresholds and ratings should not become Australian suitability rules. Supports field-specific evidence and a distinct route-data requirement. |
| **E4 — Slater and Jones (2021)**. JSTOR; `ABSTRACT_INSPECTED`.                | Disability-studies analysis drawing on research centred on trans, queer and disabled people's toilet experiences; sample size and recruitment are not specified in the abstract.                                                                              | The authors argue that an access symbol can promise more than a facility delivers, and that toilet signage and commercial/institutional access affect inclusion in public space.                                | Interpretive and normative argument with empirical grounding, not a quantified test of map symbols. Supports investigating dignity, non-apparent disability and restrictions without treating an icon as proof.                                                        |
| **E5 — Terry et al. (2025)**. JSTOR; `ABSTRACT_INSPECTED`.                    | Concept analysis drawing on literature, focus groups, interviews and consultation with disability advocacy/support organisations; participant counts are not in the inspected abstract.                                                                       | Accessibility is framed across understanding, reaching and experiencing activities; everyday encounters and organisational actions matter alongside design.                                                     | Conceptual synthesis, not an effectiveness trial or a validated numerical score. Supports evaluating the whole participant experience and governance, beyond finding a point on a map.                                                                                 |

Confidence is strongest that these are relevant questions and design concerns. Confidence is lower in generalising their magnitude or selecting a particular interface solution. The corpus does not establish current local coverage, source accuracy, the best uncertainty wording, a useful refresh interval or an acceptable rate of incorrect suitability inferences.

## Current implementation and architecture

The inspected implementation uses the existing GAIS contracts and GeoJSON projection. Its domain ownership follows [GAIS convergence](../architecture/gais-convergence.md): Access owns place/facility evidence and the public interface; GAIS exposes geographic evidence; Navigate owns route topology; Go owns journey context. This research does not create a second authority for accessibility ratings or participant preferences.

Current repository evidence:

- [Source contract](../../lib/access/community-infrastructure/types.ts): categories, source identity/licence, retrieval/edit/check dates, geometry role and `routeEndpoint: false`.
- [Normaliser](../../lib/access/community-infrastructure/normalise.ts): source-tag allowlist, separate toilet/venue semantics, raw access facts, explicit unknowns and community-reported evidence.
- [Participant interface](../../components/accessibility-map/community/CommunityInfrastructureExplorer.tsx): source-report language, missing details, date distinctions, filters, a list and an optional map.
- [Routing boundaries](community-infrastructure-routing.md): vehicle movement, arrival/transfer and pedestrian movement require different evidence.

The three bounded windows are discovery samples. Missing features may reflect incomplete mapping or query scope. A facility point, including an approximate bounding-box centre, does not supply the connection from a parking bay to an entrance. A recently downloaded record is not a recent access inspection. The current interface expresses these limits; comprehension in real use remains untested by this literature exercise.

## Design implications and schema decisions

The following are **MapAble design inferences** informed by the evidence, not findings that the studies tested in this product.

| Decision                                             | Evidence basis                                | Current or proposed consequence                                                                                                                                                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Let the participant assess relevant features.        | E1, E2, E3                                    | Retain individual access facts and explicit unknowns. Keep designation, physical characteristics, reported access and actual occupancy separate. No universal score is justified by this corpus.                                                                         |
| Treat parking as part of an arrival sequence.        | E1, E2                                        | Preserve the present location/discovery role. Future observations should distinguish the bay, transfer/ramp-deployment area, connection to the footpath and destination entrance. These require their own scope and source.                                              |
| Describe toilet usability and permission separately. | E4, supported by the existing source contract | Keep venue access separate from toilet access. Where evidence exists, show opening/key/customer restrictions and specific equipment. Baby changing, adult changing and a hoist are separate facts; no diagnosis is required to browse them.                              |
| Preserve source and observation boundaries.          | E3; implementation evidence above             | Keep retrieval, edit and check dates separately labelled. A future measured observation should include feature, value/unit, method, date and scope through existing Access evidence contracts. Literature relevance does not upgrade an OSM report to verified evidence. |
| Make inclusion assessable beyond a symbol.           | E4, E5                                        | Use category icons with text, with evidence status shown separately. Test whether participants understand who can use a facility and what remains unknown. Plain language and a usable list must carry the same information as the map.                                  |

For future measurements, reuse existing Access evidence envelopes and GAIS projections. Prefer one sourced observation per relevant feature to an additional unsourced `accessible` boolean. Before adding a new fact, agree its meaning, units, location/scope, observation method, review process and public wording. An absence of evidence must remain distinct from a recorded absence or a conflicting report.

These studies do not choose a ramp-gradient limit, doorway threshold, assistance rule or legal compliance standard for MapAble. Those decisions need relevant standards, measurement expertise and participant-selected requirements. No runtime schema or routing change is made by this document.

## Proposed participant co-design and release gate

**Proposed:** Before claiming this slice meets participant needs, conduct compensated co-design and task-based evaluation with people who use the intended areas. Include manual- and powered-wheelchair users, people who transfer or use vehicle ramps, people with ambulant and non-apparent disabilities, blind/low-vision people, and people with cognitive, sensory and communication access needs. Participants choose any supporter or delegate and how they communicate. This is an inclusion plan, not a claim that one small group represents everyone.

Use concrete tasks, chosen and adapted with participants:

1. Find a candidate parking location and identify whether transfer space and a path to the destination are evidenced.
2. Compare toilets with an explicit negative fact, an unknown fact and a venue-only access report. Explain which details still matter for the participant's own decision.
3. Plan a visit to a public space using the list, then optionally the map. Notice a centre marker, missing path information and a source date that is not an inspection date.
4. Recover from no matching records, unavailable data or a failed map load without concluding that no facilities exist.

Record task completion, assistance requested, information missed, incorrect inferences, perceived control and participant explanations. Include opportunities to decline an activity or stop without justification. Do not set an invented satisfaction target or treat successful interface navigation as proof of a physically usable journey.

The release decision needs an accessible issues log, severity assessment, correction/retest evidence and explicit review by the Access product owner, engineering reviewer and participant reviewers. Resolve critical misunderstandings about suitability, evidence or route readiness before making corresponding product claims. Field checking is a separate activity requiring its own agreed scope and participant consent.

### Accessibility assurance

Target **WCAG 2.2 AA** and MapAble's inclusive-design acceptance criteria. Combine automated checks with keyboard-only operation, visible focus, screen-reader names/states and announcements, zoom/reflow, contrast, touch-target and switch/voice-input review. Check that all key facts and recovery actions work without dragging, colour perception or opening a map. The participant can choose text/AAC-compatible communication; audio must not be the only way to complete a task.

Existing normaliser, API and interface tests verify specific software behaviours, not disability inclusion or field accuracy. Add meaningful regression tests for any misunderstanding that produces an implementation change, and retain source/provenance assertions. A passing Markdown validator is a structural document check only.

## Security, privacy and consent

The public facility layer should continue to expose public environmental evidence, not participant diagnoses, precise live journeys, interview recordings or contact details. This research used public publications and no personal health data.

For the proposed study, apply data minimisation: collect functional preferences only when necessary for the agreed task, keep research consent separate from product access, agree recording and quotation permissions, and specify retention/deletion before recruitment. Store any research records separately from public GeoJSON. Reporting should remove identifying narratives and locations where necessary; participants retain a way to correct how their experience is represented. Reuse shared Core consent and permissions rather than adding a parallel mechanism.

Source free text remains untrusted display content. Research recommendations do not authorise publishing participant feedback as OSM facts, contacting third parties or importing copyrighted article text. Human review controls any later synthesis; deterministic source validation and a non-map fallback remain necessary.

## Failure, recovery and unresolved hypotheses

If new evidence challenges a label or inference, revise that claim and retain the original source provenance. If a data refresh fails, retain the last valid dated snapshot; if a particular feature is disputed, expose the conflict through an appropriate reviewed evidence path rather than silently treating it as accessible. If a proposed interface causes critical confusion, roll back that change while preserving the current source list and evidence detail. This brief adds no new network dependency or automatic source update.

Questions requiring local evidence include:

- Do participants distinguish “unknown”, “reported” and “checked” without excessive reading burden?
- Does showing provenance near the decision improve understanding, or make an uncertain record look more authoritative?
- Which transfer, toilet, sensory and communication facts matter most for each chosen task, and which are missing from these windows?
- Are the list, filters and map usable for people with different access technologies, fatigue and intermittent connectivity?
- What source-change reporting and review process can the team reliably operate?

These are hypotheses and delivery questions, not demonstrated product outcomes. The corpus is particularly limited for Australian local conditions, adult-change requirements, Deaf/deaf and communication access, cognitive accessibility, and ongoing maintenance. Further targeted research and participant-led prioritisation should fill those gaps before broader claims.

## Sources and reproducible search record

### Selected references

- **E1.** Hutchinson, C., Berndt, A., Gilbert-Hunt, S., George, S., & Ratcliffe, J. (2020). _Modified motor vehicles: the experiences of drivers with disabilities_. Disability and Rehabilitation, 42(21), 3043–3051. [PubMed PMID 30907156](https://pubmed.ncbi.nlm.nih.gov/30907156/); [DOI 10.1080/09638288.2019.1583778](https://doi.org/10.1080/09638288.2019.1583778).
- **E2.** Kirchner, C. E., Gerber, E. G., & Smith, B. C. (2008). _Designed to deter. Community barriers to physical activity for people with visual or motor impairments_. American Journal of Preventive Medicine, 34(4), 349–352. [PubMed PMID 18374250](https://pubmed.ncbi.nlm.nih.gov/18374250/); [DOI 10.1016/j.amepre.2008.01.005](https://doi.org/10.1016/j.amepre.2008.01.005).
- **E3.** Mayordomo-Martínez, D., Carrillo-de-Gea, J. M., García-Mateos, G., García-Berná, J. A., Fernández-Alemán, J. L., Rosero-López, S., Parada-Sarabia, S., & García-Hernández, M. (2019). _Sustainable Accessibility: A Mobile App for Helping People with Disabilities to Search Accessible Shops_. International Journal of Environmental Research and Public Health, 16(4), 620. [PubMed PMID 30791577](https://pubmed.ncbi.nlm.nih.gov/30791577/); [PMC6406930 full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6406930/); [DOI 10.3390/ijerph16040620](https://doi.org/10.3390/ijerph16040620).
- **E4.** Slater, J., & Jones, C. (2021). _Toilet Signs as Border Markers: Exploring Disabled People's Access to Space_. International Journal of Disability and Social Justice, 1(1), 50–72. [JSTOR public item and abstract](https://www.jstor.org/stable/10.13169/intljofdissocjus.1.1.0050); DOI 10.13169/intljofdissocjus.1.1.0050.
- **E5.** Terry, G., Anstiss, D., Fadyl, J., Payne, D., Allan, R., & Kayes, N. (2025). _“That Says, For Me, You Are a Second-Class Citizen”: A Concept Analysis of Accessibility_. International Journal of Disability and Social Justice, 5(1), 4–28. [JSTOR stable item 48828309 and abstract](https://www.jstor.org/stable/48828309). A DOI was not independently verified for this record.

### Retrieval method and limits

The named **PubMed + JSTOR Disability Research** and **JSTOR Research** skills supplied the evidence/access-label workflow. The available PubMed connector performed literature searches, PMID metadata verification and rights-eligible PMC full-text retrieval. No JSTOR connector was available; public JSTOR item pages were inspected through web retrieval. No institutional access, paywalled full-text access or bulk text-analysis entitlement was assumed.

PubMed searches used relevance order with no date or language filter. The following exact queries returned the indicated counts at retrieval. Only the specified first page was inspected; this is not exhaustive screening:

| Query                                                                                                                                                                                                                       | Total results / inspected first page |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `wheelchair users community accessibility built environment qualitative`                                                                                                                                                    | 4 / 4                                |
| `(wheelchair[Title/Abstract] OR disab*[Title/Abstract]) AND (toilet*[Title/Abstract] OR parking[Title/Abstract]) AND (public[Title/Abstract] OR community[Title/Abstract])`                                                 | 214 / 5                              |
| `(wheelchair OR disability) AND (wayfinding OR accessibility information OR accessibility mapping) AND (community OR urban OR navigation)`                                                                                  | 3,496 / 5                            |
| `(wheelchair[Title/Abstract] OR disabled[Title/Abstract]) AND (mapping[Title/Abstract] OR wayfinding[Title/Abstract] OR "accessibility information"[Title/Abstract])`                                                       | 306 / 8                              |
| `(wheelchair[Title/Abstract] OR disability[Title/Abstract]) AND (wayfinding[Title/Abstract] OR "accessibility information"[Title/Abstract] OR "accessibility map"[Title/Abstract] OR "accessibility maps"[Title/Abstract])` | 37 / 10                              |

The latter query narrowed irrelevant robotics/motor-control results. Final PMID retrieval verified E1–E3 metadata; PMC returned the complete 46,705-character article body for E3 with no continuation and a CC BY licence statement. E4 and E5 were found using public web searches for `disability public space accessibility` and `"The Socio-spatial Construction" "jstor"`, restricted to JSTOR where supported, then opened directly at the stable URLs above. Searches were also attempted with `site:jstor.org "public toilets" "Kitchin" "Law"`. No current claim is drawn from unrelated or metadata-only results.

For reproducible direct JSTOR follow-up, use a recall query such as `disability AND (toilets OR "public space")` and a precision query such as `ti:"Toilet Signs as Border Markers"`. This brief does not claim those exact JSTOR-interface queries were executed. Public abstract access was sufficient for the limited interpretive claims made here; deeper methods appraisal would require inspection of the relevant full texts.
