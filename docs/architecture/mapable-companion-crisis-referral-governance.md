# MapAble Companion — Australian crisis referral governance

**Status:** In development, not production clinical governance  
**Verified:** 2026-09-08  
**Scope:** MapAble Companion / Ask MapAble mental-health and suicidality safety routing

## Decision

MapAble may provide a verified, accessible pathway into Australian crisis and mental-health services, but it must not present itself as an emergency service, diagnose a mental-health condition, predict suicide, replace a qualified assessment, or claim an external service has accepted a referral unless that service confirms acceptance.

## Core routing model

1. **Immediate danger** — surface Triple Zero (000) and accessible emergency relay options first.
2. **Explicit suicidal/self-harm concern without confirmed immediate danger** — ask a direct safety question and surface suicide-specific crisis counselling plus human support.
3. **Clinical mental-health triage** — offer the current state/territory public mental-health pathway when jurisdiction is known from an authorised context or chosen by the participant.
4. **Identity/community-specific support** — offer, but never infer eligibility for, options such as 13YARN, Kids Helpline, MensLine and QLife.
5. **Non-crisis follow-on care** — future slices may include Medicare Mental Health, healthdirect, GP and local service discovery as step-down pathways. Do not mislabel these as crisis services.

## Screening is not prediction

The Companion guardrail currently uses only high-signal deterministic wording to decide whether ordinary assistant processing should be interrupted. It does not generate a clinical risk score.

A formal validated screener is separately feature-gated by `MAPABLE_MENTAL_HEALTH_ASQ_SCREENING_ENABLED` and remains OFF until:

- a qualified clinical governance owner is identified;
- an operational response protocol exists for every positive/uncertain result;
- disability and lived-experience review is completed;
- communication-access and supported decision-making requirements are tested;
- privacy, retention, access and correction rules are approved;
- false-positive and false-negative handling is documented;
- escalation coverage is resourced.

A negative screen must never be represented as proof that a person is safe. A positive screen must never be represented as a prediction that a person will attempt suicide.

## Referral and handoff states

MapAble must distinguish:

- `PRESENTED` — a verified service option was shown;
- `USER_INITIATED` — the participant opened/called/texted a service themselves or explicitly requested MapAble assistance;
- `HUMAN_ASSISTANCE_REQUESTED` — MapAble recorded a request for a MapAble worker to review; this is not acceptance;
- `HUMAN_ASSISTED` — a MapAble worker actually helped the participant initiate contact with consent;
- `EXTERNAL_ACCEPTED` — the external service explicitly confirmed acceptance or connection;
- `EMERGENCY_HANDOFF` — an authorised emergency process was used because immediate safety required it.

Do not collapse `PRESENTED`, `USER_INITIATED` or `HUMAN_ASSISTANCE_REQUESTED` into `EXTERNAL_ACCEPTED`.

## Warm human handoff contract

The first MapAble warm-handoff slice is intentionally narrow:

1. The participant chooses **Request MapAble human review**.
2. MapAble records only fixed purpose metadata and optional allow-listed communication-access preferences.
3. The crisis conversation, disability narrative, location and contacts are not copied into the AgentRun handoff record.
4. The record is marked for human review with `externalAcceptanceConfirmed: false`.
5. The UI tells the participant that the request being recorded does not mean a MapAble person or external crisis service has accepted it.
6. Emergency and external crisis pathways remain visible and independently usable.

A later human-assisted sharing step must obtain purpose-bound consent for each disclosure. It must be possible to share a participant-authored or participant-approved summary without sharing the full conversation.

## Consent and privacy

Emotional disclosure is sensitive information. MapAble should minimise collection and must not silently send conversation transcripts, disability information, health details, location, contacts or support-worker details to a crisis service.

Before a non-emergency human-assisted handoff, obtain purpose-bound consent for the minimum information needed. Let the participant choose what MapAble prepares or shares.

The crisis handoff audit record should prefer fixed metadata such as:

- referral state;
- handoff state;
- communication-access flags selected by the participant;
- whether free text was stored;
- whether external acceptance has been confirmed.

Do not use crisis disclosures, loneliness statements, screening results or referral choices for advertising, behavioural targeting, engagement optimisation or cross-module marketing.

## Accessible communication

A crisis pathway is not effective if the person cannot use it. The interface must preserve:

- AAC and typed communication;
- screen reader and keyboard access;
- switch and eye-gaze compatible controls;
- large stable targets;
- plain-language and one-step-at-a-time presentation;
- extra response time;
- National Relay Service pathways for d/Deaf, hard-of-hearing and speech-access users;
- interpreter pathways where available;
- the participant's chosen trusted person or supporter when they request this and authority/consent is clear.

Communication disability is not evidence of incapacity. Distress, silence, delayed response or AAC use must not be converted into consent, refusal or incapacity.

## Current verified Australian pathways

### Emergency

- Triple Zero (000) — immediate danger / urgent ambulance, police or fire response.
- National Relay Service — emergency relay pathways, including SMS Relay to 0423 677 767 with the emergency-service request and location.

### National crisis / suicide support

- Lifeline — 13 11 14; text 0477 13 11 14; online chat; 24/7.
- Suicide Call Back Service — 1300 659 467; professional phone, online and video counselling; 24/7; for people aged 15+ affected by suicide.
- 13YARN — 13 92 76; Aboriginal and Torres Strait Islander Crisis Supporters; 24/7.
- Kids Helpline — 1800 55 1800; phone and webchat; 24/7 for children and young people.
- MensLine Australia — 1300 78 99 78; phone and online counselling; 24/7.
- QLife — 1800 184 527 and webchat; 3 pm–9 pm daily local time.

### State and territory pathways

- ACT — Access Mental Health: 1800 629 354.
- NSW — Mental Health Line: 1800 011 511.
- NT — Mental Health Line: 1800 682 288.
- QLD — 1300 MH CALL: 1300 642 255.
- SA — Mental Health Triage Service: 13 14 65.
- TAS — Access Mental Health / Mental Health Services Helpline: 1800 332 388.
- VIC — SuicideLine Victoria: 1300 651 251.
- WA — Mental Health Emergency Response Line: Metro 1300 555 788; Peel 1800 676 822.

## Current source register

- Healthdirect Australia — mental health crisis support and Australian mental-health services.
- NSW Health — Mental Health Line.
- Lifeline Australia — crisis support services.
- Suicide Call Back Service.
- 13YARN.
- Kids Helpline.
- MensLine Australia.
- QLife.
- Australian Government Access Hub — National Relay Service emergency calling.
- Medicare Mental Health / Healthdirect listings for state and territory crisis pathways.

These details are operational data and must be re-verified regularly. A scheduled verification process should compare service name, number, channels, hours, audience, jurisdiction and official source before deployment releases.

## Implementation boundaries

Current implementation:

- `lib/ask-mapable/mental-health-safety.ts` — deterministic high-signal safety classification and crisis response;
- `lib/ask-mapable/crisis-referrals.ts` — provenance-led Australian referral directory and referral-state rules;
- `app/api/mapable/crisis/route.ts` — no-model, no-persistence preflight endpoint;
- `app/help/crisis/page.tsx` — accessible public crisis directory;
- `components/ask-mapable/AskMapAbleResponseActions.tsx` — safe telephone/external link rendering;
- `lib/ask-mapable/crisis-handoff.ts` — minimal-metadata MapAble human-review request recorder;
- `app/api/mapable/crisis/handoff/route.ts` — authenticated participant-controlled request endpoint;
- `components/crisis/CrisisHumanAssistanceCard.tsx` — accessible participant-facing handoff control;
- formal clinical screening remains OFF.

## Ethical decision for this slice

**ALLOW_WITH_SAFEGUARDS.** A participant-requested warm handoff can improve access to human support, but only if it remains voluntary, transparent, privacy-minimising, communication-accessible and explicit about its operational limits. Silence, distress, communication disability or use of AAC do not authorize disclosure or escalation by themselves.

## Required next review

Before pilot activation, require review by:

1. qualified Australian mental-health/suicide-prevention clinician;
2. disability lived-experience reviewers including AAC/communication-access users;
3. privacy/safeguarding owner;
4. operational owner responsible for human escalation and after-hours limitations.

Before claiming a production-quality warm handoff, also verify:

- who receives the MapAble human-review request;
- staffed hours and response expectations;
- what happens if no staff member accepts the request;
- how `HUMAN_ASSISTANCE_REQUESTED` becomes `HUMAN_ASSISTED`;
- how external acceptance is recorded without inference;
- retention/deletion rules for handoff metadata;
- accessibility across keyboard, screen reader, switch, eye-gaze and AAC workflows.
