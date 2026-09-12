# MapAble Companion — participant-authored support planning

**Status:** In development; not a clinical safety-planning service  
**Verified operational sources:** 2026-09-10  
**Scope:** `/help/crisis` support-plan drafting, consented preview and non-crisis navigation

## Decision

MapAble may help a participant write down, in their own words, what they notice when things become harder, what they choose to try, who they choose to involve, which professional supports they choose, what environmental changes feel safer, and how they communicate.

The feature must be described as a **participant-authored support plan**, not a suicide-risk assessment, diagnosis, prediction, proof of safety, or clinically validated Safety Planning Intervention.

## Why this boundary exists

Safety planning is an evidence-supported suicide-prevention practice when delivered within appropriate clinical and service contexts. MapAble is not currently operating a clinically governed suicide-prevention treatment service. The product can safely support self-authorship and communication without claiming clinical equivalence.

Accessibility adaptations for people with intellectual, cognitive or communication disability are important design requirements. They must not be marketed as a validated clinical adaptation unless the exact adaptation and population have appropriate evidence and clinical governance.

## Participant control contract

1. The participant can use the plan without signing in.
2. Draft text stays in browser component state for the current session and is not automatically persisted to MapAble.
3. Every section is optional and may be left blank.
4. Completion percentage or section count is never converted into a safety or risk result.
5. The participant separately chooses which completed sections appear in a private preview.
6. A preview is not sent, shared, saved or accepted by another service.
7. A later sharing workflow must separately identify recipient, purpose and selected fields before disclosure.
8. The participant must be able to edit, clear, decline or stop without penalty.

## Current sections

- **What I notice first** — participant-described changes, feelings or situations.
- **Things I can try** — participant-chosen coping or immediate support actions.
- **People or places that help me feel grounded** — chosen connection, activity or distraction options.
- **People I choose to ask for support** — chosen people only; no automatic contact.
- **Professional or crisis supports I choose** — chosen clinicians or services.
- **Things that make my environment feel safer** — participant-authored changes or help they want arranging; MapAble does not automatically remove items, restrict the person, or change their environment.
- **How I communicate** — AAC, text, Auslan, relay, extra response time, one-question-at-a-time or other participant-described access needs.

These headings are product prompts, not a claim that the feature implements a proprietary or validated clinical instrument.

## Consent and disclosure

The support-plan draft and any handoff summary are sensitive information. The current slice implements **preview only**.

`buildConsentedSupportSummary`:

- accepts an explicit list of selected sections;
- excludes every unselected section even when it contains text;
- excludes empty selected sections;
- returns `sent: false`;
- returns `externalAcceptanceConfirmed: false`.

A future transmission feature must not infer consent from drafting, ticking a section, opening a service link, distress, silence, AAC use or a prior human-support request.

## No automatic contact or restrictive action

MapAble must not automatically:

- contact family, carers, workers, clinicians or crisis services from support-plan content;
- disclose location or health/disability information;
- remove or arrange removal of possessions or medications;
- lock a person out of services;
- summon emergency services merely because a support-plan field contains concerning language.

Immediate-danger routing remains governed by the separate crisis preflight and authorised emergency pathways. Any restrictive or emergency action requires its own lawful, necessary and proportionate authority.

## Accessibility acceptance criteria

The plan must support WCAG 2.2 AA and practical use with:

- keyboard and screen readers;
- switch and eye-gaze navigation through native controls;
- AAC and typed composition;
- touch targets at least 44 by 44 CSS pixels where controls are interactive;
- visible focus;
- plain-language prompts;
- no time limit or forced response pace;
- sections that can be skipped;
- status messages that do not rely on colour alone.

Communication method is an access requirement, not evidence of incapacity.

## Non-crisis step-down navigation

The same help surface now separates crisis response from follow-on navigation.

### healthdirect

- Phone: 1800 022 222.
- Registered-nurse health advice is available 24 hours a day, 7 days a week.
- National Relay Service and TIS pathways are supported by healthdirect.
- This route is presented as clinical navigation/advice, not emergency dispatch.
- Official source: `https://www.healthdirect.gov.au/contact-us`.

### Medicare Mental Health

- Phone: 1800 595 212.
- Free mental-health advice, assessment and referral to local services.
- Availability: Monday to Friday, 8:30 am to 5:00 pm, excluding public holidays.
- Medicare Mental Health explicitly states that the national phone service is **not a crisis service**.
- Official source: `https://www.medicarementalhealth.gov.au/service/national-phone-service-17838`.

### 1800RESPECT

- Phone: 1800 737 732.
- Text: 0458 737 732.
- Online chat and video call are also available 24/7.
- This is a specialised domestic, family and sexual violence counselling, information and support pathway, not something MapAble should infer from general distress.
- Official source: `https://www.1800respect.org.au/FAQ`.

Operational contact data must be re-verified before release and on an ongoing schedule.

## Evidence posture

Published research supports safety planning as a suicide-prevention intervention in clinical contexts, including evidence of reduced suicidal behaviour when safety planning is paired with structured follow-up. Emerging literature also supports adapting communication and teaching methods for people with intellectual and developmental disability.

This evidence **does not** establish that the current MapAble component is clinically validated. The current assurance level is **designed control / implemented control pending CI**, not tested clinical intervention or independently assured care.

## Ethical decision

**ALLOW_WITH_SAFEGUARDS** for the participant-authored, local, preview-only product slice.

Clinical deployment as a validated suicide-prevention intervention remains **HOLD_BRANCH** until there is accountable Australian clinical governance, disability lived-experience review, privacy/retention approval, operational escalation coverage and evidence that the exact workflow is safe and accessible.

## Required review before broader pilot

1. Australian mental-health/suicide-prevention clinician.
2. Disability lived-experience reviewers, including AAC and intellectual/cognitive disability perspectives.
3. Privacy and safeguarding owner.
4. Human-support operational owner.
5. Accessibility testing with keyboard, screen reader, switch/eye-gaze and AAC workflows.
6. Legal/privacy review before any persistent storage or external transmission is added.
