# MapAble Full Life Constitution

**Status:** Proposed constitutional specification. Design only; this document does not expand runtime authority, change NDIS eligibility or funding decisions, or create a new system of record.

**Date:** 2026-09-14

**Canonical repository:** `ausdisau/mapableau-new`

**Supersedes as design direction:** the unmerged `feature/full-life-os-constitution` branch. Compatible rights principles are retained here, but implementation must be based on current `main`.

## 1. Constitutional purpose

MapAble exists to expand the practical freedom of people with disability to pursue lives they themselves choose, by reducing accessibility, coordination, information and service barriers while protecting autonomy, legal agency, dignity, privacy, safety, relationships, participation and equitable access to finite resources.

MapAble must optimise systems around the person. It must not optimise the person to fit the system.

“Full Life” is deliberately non-prescriptive. It is not a productivity target, an independence score, a clinical outcome, a funding score, a quality-of-life score or a standard life course. It means having genuine practical opportunity to pursue relationships, home, community, mobility, learning, work, culture, recreation, health, identity, civic life and other domains the person values.

## 2. Constitutional position in the existing stack

This constitution does **not** create a second Rights system, mission store, participant profile, consent ledger or action runtime.

It sits above and constrains existing canonical owners:

- `LifeIntent` remains the durable participant-authored expression of what the person wants.
- `CareOSMission` / the Mission Runtime remain the cross-domain planning and mission state.
- `RightsOS` and existing consent / authority records remain the purpose, disclosure and permission authorities.
- `AccessPassport` and existing accessibility / communication records remain the functional-requirements sources.
- the Governed Action Kernel remains the approval-bound deterministic execution boundary.
- the existing audit spine remains the source of execution evidence.
- AURA remains the operational / agentic risk harness.
- the existing AI evaluation runner remains the synthetic evaluation framework.

The Full Life layer adds a **rights-compatibility projection and assurance contract** across these existing systems. It must be read-only with respect to canonical domain state except where an existing approved service explicitly accepts its bounded output.

## 3. Evidence and claim discipline

For rights-sensitive recommendations use, in order:

1. current directly applicable law and binding authority;
2. authoritative treaty text and formal treaty-body interpretation;
3. current regulator / government guidance;
4. disability-led representative and inquiry evidence;
5. peer-reviewed empirical research;
6. disability-studies, ethics and social-policy scholarship;
7. approved MapAble policy and product decisions;
8. model inference, explicitly labelled.

Conflicts remain visible. Unknown remains unknown. Inference never becomes verified evidence merely because it is repeated.

No Full Life output is a binding legal conclusion, NDIS entitlement determination, registration decision, funding approval, reportability finding, capacity determination or clinical decision.

## 4. Interpretive rules

### Person before programme

NDIS, health, housing, employment, education, transport, aged care and other systems are resources around the person. They do not define the person’s life.

### Will and preferences before administrative convenience

A participant’s expressed will and preferences cannot be displaced merely because another option is easier for a provider, family member, government process, algorithm or service coordinator.

### Barrier before deficit

When participation is difficult, MapAble first examines environmental, attitudinal, communication, information, policy and service barriers rather than treating impairment as the sole problem.

### Support is compatible with autonomy

Human assistance, AAC, supported decision-making, personal assistance and interdependence can be means of exercising autonomy. Independence is not defined as doing everything without help.

### Substantive equality

Equal opportunity may require different supports and resource levels. Equal nominal expenditure is not assumed to produce equal capability or participation.

### Rights-compatible resource stewardship

Cost, efficiency, reliability and sustainability may be compared **only among options that remain rights-compatible and meet participant-defined hard constraints**. Resource scarcity must never be converted into a score of human worth or deservingness.

### Contestability

The more consequential a proposal, the stronger the requirements for provenance, accessible explanation, uncertainty, human accountability, alternatives, participant review, appeal / complaint and remedy.

## 5. Constitutional invariants

The rule IDs below are intended to become machine-testable product invariants. They are product safeguards, not automated legal findings.

### FL-001 — Equal human worth and human diversity

**Rule:** Disability, diagnosis, communication method, support intensity, employment status, social conformity, predicted cost or economic return must never be used as a proxy for human worth.

**Must:**
- reject `social_worth_score`, `life_value_score`, `deservingness_score` and equivalent constructs;
- keep system-cost analysis separate from judgments about the person;
- reject burden, tragedy or charity framing as an allocation rationale.

**Hard-fail examples:** `social_worth_ranking`, `productivity_as_deservingness`, `quality_of_life_devaluation`.

### FL-002 — Participant authorship and supported decision-making

**Rule:** The participant is presumed to be the author of decisions about their own life. Support enables decision-making; it does not silently transfer authority.

**Must:**
- distinguish `support_for_decision` from `authority_to_decide`;
- scope delegates / nominees / guardians / supporters by purpose, decision, duration and revocation / expiry;
- record participant will and preferences separately from provider or supporter recommendations;
- require accountable human / legal review before treating another actor as substitute authority for a consequential decision.

**Hard-fail examples:** `communication_difficulty_as_incapacity`, `delegate_as_blanket_owner`, `family_convenience_over_will_preferences`, `ai_capacity_finding`.

### FL-003 — Accessibility and communication are preconditions

**Rule:** A service that cannot be accessed, understood or used by the person is not an equal service merely because it exists.

**Must:**
- treat WCAG 2.2 AA as the digital minimum, plus task-specific assistive-technology testing;
- support keyboard, screen reader, magnification / reflow, AAC / text-compatible confirmation and accessible human help for critical journeys;
- keep communication preferences operational rather than decorative profile notes;
- never treat response latency, AAC use or speech difference as refusal or incapacity.

**Hard-fail examples:** `inaccessible_only_path`, `aac_ignored`, `communication_mode_downgrade_without_consent`, `timeout_as_refusal`.

### FL-004 — Person-defined capabilities and life domains

**Rule:** Full Life missions begin with participant-defined intentions, responsibilities, relationships or valued activities — not a funding line item or platform sales opportunity.

**Must:**
- make life domains optional and participant-selected;
- avoid compulsory normative life templates;
- preserve rejection of platform-proposed goals;
- measure barrier reduction / practical opportunity rather than service utilisation alone.

**Hard-fail examples:** `mandatory_normative_life_path`, `employment_as_universal_goal`, `service_utilisation_as_success`, `goal_reintroduced_after_refusal`.

### FL-005 — Independent living, relationships and community inclusion

**Rule:** Support requirements do not diminish the validity of a person’s choices about home, relationships, support people or community participation.

**Must:**
- detect forced co-residence, segregation, provider lock-in and dependency created by a proposal;
- never assume unpaid family or friend support is available, willing, safe or cost-free;
- preserve chosen living / participation arrangements where reasonably possible and surface conflicts for review.

**Hard-fail examples:** `forced_shared_living_for_cost`, `family_care_assumed`, `support_provider_controls_home`, `segregation_as_default`.

### FL-006 — Equality, non-discrimination and intersectional justice

**Rule:** MapAble must test for direct exclusion and disproportionate disadvantage, including intersections between disability and other relevant characteristics or circumstances.

**Must:**
- evaluate differential no-match, escalation, ranking and error rates across synthetic demographic and access cohorts;
- separate genuine service constraints from proxy discrimination;
- avoid diagnosis-based exclusions where functional requirements are sufficient.

**Hard-fail examples:** `protected_trait_proxy_exclusion`, `diagnosis_only_filter_without_need`, `systematic_access_cohort_disadvantage`.

### FL-007 — Privacy, purpose limitation and disclosure control

**Rule:** Identity and authentication do not imply permission to disclose or reuse information.

**Must:**
- bind disclosure to who / what / why / duration / permitted use / revocation;
- minimise disability, health, location and financial data;
- separate authority grants from disclosure receipts;
- keep employer / provider disclosure participant-controlled unless lawfully required otherwise.

**Hard-fail examples:** `blanket_cross_module_reuse`, `employer_disclosure_without_scope`, `revoked_consent_reuse`, `delegate_reads_outside_scope`.

### FL-008 — Evidence integrity, uncertainty and provenance

**Rule:** MapAble must preserve the epistemic state of information.

**Must:**
- distinguish verified, participant-supplied, system-supplied, inferred, conflicting, stale, missing and not-authorised states;
- keep conflicting sources visible;
- attach recency / expiry to credentials and access observations;
- never convert absence of evidence into evidence of absence.

**Hard-fail examples:** `unknown_as_false`, `inference_as_verified`, `stale_credential_as_current`, `conflict_flattened`.

### FL-009 — Dignity of risk and proportional safeguarding

**Rule:** Safety mechanisms must identify and mitigate material risk without automatically replacing participant choice with the most restrictive option.

**Must:**
- explain material risk, uncertainty and feasible mitigation;
- distinguish legal / operational constraints from preferences;
- escalate genuinely high-impact safeguarding questions to accountable humans;
- test for paternalistic overreach as well as unsafe under-response.

**Hard-fail examples:** `safest_option_auto_selected`, `risk_used_to_remove_choice`, `safeguarding_ignored`, `ai_reportability_finding`.

### FL-010 — Financial integrity and resource stewardship

**Rule:** The harness may expose funding, cost, capacity and resource constraints but must not decide that a person’s goal is unworthy because it costs more.

**Must:**
- represent money, participant time, workforce, transport capacity, funding authority, mainstream services and community resources as separate resource states;
- never assume informal support as a free resource;
- keep NDIS guidance / line-item suggestions advisory and versioned;
- prohibit autonomous payment release, claim approval or funding eligibility decisions.

**Hard-fail examples:** `cheapest_over_access_requirement`, `informal_support_as_free_capacity`, `auto_claim_approval`, `cost_as_human_value`.

### FL-011 — Commercial neutrality and conflict transparency

**Rule:** A financial interest of MapAble, a provider, advertiser or partner must never silently alter fit, accessibility, safety or evidence ranking.

**Must:**
- attach commercial-influence metadata to candidate options;
- separate sponsored placement from suitability ranking;
- expose MapAble-owned-service, referral-fee and commission conflicts;
- ensure equal evaluation rules for owned and external services.

**Hard-fail examples:** `sponsor_boosts_fit_score`, `mapable_owned_service_hidden_preference`, `commission_changes_safety_result`.

### FL-012 — Reversibility, remedy and accountable execution

**Rule:** Consequential actions must remain inspectable, attributable and reversible where technically / legally possible; where not reversible, stronger approval is required.

**Must:**
- preserve participant rejection / pause / replan controls;
- provide complaint, correction and human escalation paths;
- require approval-bound deterministic execution for consequential actions;
- record proposal, authority, evidence, execution and outcome as auditable events;
- degrade to manual / human pathways rather than fabricate certainty when automation fails.

**Hard-fail examples:** `silent_execute`, `rejected_action_reintroduced`, `no_human_fallback`, `irreversible_action_without_required_approval`.

## 6. Full Life anti-patterns

The following constructs are constitutionally prohibited unless a future human-approved constitutional amendment explicitly changes the rule:

- a scalar `FullLifeScore` or equivalent whole-person ranking;
- autonomous NDIS eligibility, funding or claim approval;
- autonomous capacity determinations;
- autonomous clinical treatment / prescribing decisions;
- autonomous sensitive disclosure to employers / providers;
- autonomous high-impact worker or living-arrangement assignment;
- hidden commercial optimisation of participant recommendations;
- inferred family / informal care availability;
- behavioural manipulation intended to increase dependency on MapAble.

## 7. Relationship to AURA and the Full Life Harness

AURA answers: **what is the operational / agentic risk of this proposed tool action?**

The Full Life Harness answers: **is this proposed plan or action compatible with participant rights, authority, accessibility, evidence, resource boundaries, continuity, commercial integrity and remedy requirements?**

AURA risk outputs may be consumed as evidence by Full Life. Full Life must not reimplement AURA scoring, gamma calculations, mitigation memory or operational risk policy.

Neither harness may expand runtime authority. The Governed Action Kernel remains the execution boundary.

## 8. Current external baselines

At design date, implementation must remain compatible with:

- the current National Disability Insurance Scheme Act 2013 and applicable Rules;
- the NDIS Code of Conduct and relevant Practice Standards / registration conditions;
- current NDIS digital-platform registration obligations where MapAble performs the regulated intermediary function;
- Australian privacy and consumer-law obligations appropriate to the deployed service;
- WCAG 2.2 AA as the minimum digital accessibility baseline;
- any stricter domain-specific transport, employment, child-safety, clinical or financial rules for a deployed module.

Current law / regulator guidance must be re-verified before production release. This constitution is not legal advice.

## 9. Amendment rule

A Full Life constitutional amendment must:

1. identify the affected `FL-*` rules;
2. state the participant-rights impact;
3. provide authoritative evidence / rationale;
4. include disability-led review;
5. update synthetic harness scenarios;
6. update implementation fitness tests where applicable;
7. create an auditable version record;
8. never be approved solely by an AI system.
