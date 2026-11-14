# MapAble Places · Evidence Lens participant usability study
**Protocol v0.1 · 5 November 2026 · Proposed research, not completed testing**

## Purpose and decisions

**Primary question:** Can disabled participants independently understand what a place's evidence does—and does not—establish, compose useful pre-visit questions, and choose what happens to those questions, using their preferred access method?

**Decisions this study informs:** (1) whether the Evidence Lens wording is safe to release; (2) which authoring and control barriers must be repaired; (3) whether optional CripSquare gathering readiness can be progressed beyond an illustrative prototype.

**Project scope:** Expo \`apps/places\` on the separate draft PR #656. Uses *fictional/synthetic tasks and no real messages*, source-labelled places from the demonstration. It is not a medical evaluation, participant eligibility assessment, proof of venue access, or a WCAG/ATAG certification exercise.

## Research governance before recruiting

- A disability-led research lead approves all materials, tests the study with a paid accessibility adviser, and decides whether ethics review is needed for the intended publication, external collaborators or institutional context.
- Provide a plainly worded information sheet and accessible consent options, separately covering: participation, optional notes, optional audio/screen recording, optional quotations and use of de-identified findings. **Recording is off unless actively consented to**. Do not require a signature if an accessible, auditable alternative is agreed.
- Compensate participants at a mutually agreed fair rate for session, preparation and access-related effort. Pay even if someone declines recording, pauses, stops or cannot complete a task. Reimburse reasonable extra costs/communication support.
- Recruiting does not require diagnosis disclosure. Ask instead about the individual's preferred communication, access mode, device, break needs, testing format and support person if they choose. Do not infer decisional capacity from AAC, speech or response speed.
- No login or real identities in the test application. Use coded IDs (e.g. P001) only in research logs. Keep participant contact/consent data **outside GitHub** in a controlled, access-limited system.
- Retention, storage location, authorised researchers, ethics approval status and deletion procedure **must be approved before any personal data is collected**. Do not treat example retention periods as an approved policy.
- Do not request medication, diagnoses, home addresses, live GPS traces, personal location histories, names of support workers or other sensitive facts. Use sample venue tasks.
- Facilitator must demonstrate how to stop at any moment and explicitly tell participants that there is no right answer, no requirement to "think aloud," and no message will be sent for them.
- If any safety/privacy problem appears (e.g. a system sends a draft unprompted), stop the session and escalate to a designated human incident lead. No forced continuation.

## Recruitment and session design

**Formative sample (proposed):** 8–12 paid adult participants with diverse *interaction methods*, not just diagnoses. Include users who primarily use keyboard-only navigation; screen readers (NVDA/Firefox and/or VoiceOver/Safari, TalkBack/Android); switch access; AAC or alternative input; and enlarged text/zoom. A participant may use more than one, and some will be novice users; do not force a one-person-per-technology quota. Include people who find literacy, cognitive load, fatigue or communication speed relevant to their experience. Avoid extrapolating small-sample results to all disabled people.

**Format:** 45–60 minutes with participant-controlled pacing, optional short or multiple sessions, self-directed or facilitated remote/in-person. Support person/interpreter/AAC facilitator only with participant permission and no substituted answers. Offer written tasks in advance, accessible text, audio, easy-read version and other individual formats on request. Avoid timed input thresholds.

**Pre-conditions:** Test on a non-production copy of the branch with an approved synthetic dataset. Verify on a clean device/browser that no real publishing, attendance, account, location or background tracking occurs. Store no personal preferences or access needs; let users choose the features relevant to the fictional scenario.

## Tasks (facilitator presents the goal, not the click path)

**T0. Orientation (unscored).** Explain the example-library situation; show how to exit, pause and decline recording. Participant selects their preferred input and can explore freely.

**T1. Locate a relevant feature.** At a fictional Sydney community library, ask: "Find what the record says about step-free entry. Does it confirm that the entire trip will work?" Observable: finds place and evidence, distinguishes "published source describes" from "independently verified."

**T2. Interpret uncertainty.** Show a venue where the toilet is **conditional** and communication/transport information is **not assessed**. Ask: "What do you know; what would you still need to confirm before visiting?" Observe false certainty, ambiguity, misread status and ability to find provenance.

**T3. Prepare a useful enquiry.** Ask the participant to prepare two relevant practical questions for the venue without sharing a diagnosis. They may freely select/deselect features, edit text, use AAC or dictation, and remove inappropriate suggested wording. Assess content usefulness and ownership, not typing speed.

**T4. Control sharing.** Ask: "Show how you would review the draft and keep it private. Now show how you would share if you wanted to—but do not actually send." Observe comprehension of the OS share sheet, cancel path and whether the UI implies a message was sent. The test stops before choosing a recipient. *Never send a real message.*

**T5. Plan a fictional CripSquare gathering.** With the illustrative book club, ask: "What would you check before inviting others?" Observe whether the participant understands that there is no actual invitation, RSVP, venue confirmation or member-location publication.

**T6. Recover and adapt.** Optional if comfortable: switch to 200%/400% zoom, rotate device or interrupt editing. Look for text loss, hidden controls, focus disruption or inability to revise. Participant may stop without penalty.

To minimise learning effects, counterbalance the order of T1–T3 between participants where possible. Always keep T4 after a draft exists and T5 after general orientation.

## Observation framework

For each task, record only:
- Outcome: **completed independently / completed with chosen assistance / could not complete because of UI / declined / not attempted**.
- Evidence comprehension: **understood the difference / uncertain or partial / asserted unsupported verification**. Capture a concise anonymised quote only with separate consent.
- Question quality: Does it identify concrete access features, explain conditions, allow uncertainty and avoid diagnosing the participant? Use a short qualitative rubric, not a numerical score of the person.
- Sharing authority: Did the user recognise the point of disclosure, the recipient selection, cancel control, and no-send default? Note any accidental movement towards actual sharing; this is a **safety failure**, not participant error.
- Interaction barriers: keyboard trap, unlabeled control, focus not visible, screen-reader announcement, choice not accessible by switch/AAC, input lost, zoom clipping, unnecessary forced timing, cognitive burden.
- Subjective experience: optional open question "What did you feel you could decide for yourself?" and optional 1–5 scales for understanding and control, offered verbally, AAC or written without pressure.
- Facilitator interventions and reason, device/OS/browser/AT version when relevant **without persistent device identifiers**.
- Elapsed time, if collected, only to characterise interaction (e.g. fatigue or interface waiting), **never as a capability or worth score**.

## Stop / repair / release gates

**Stop the study immediately** on unintended external data sharing, inadvertent disclosure of personal data, unexpected tracking, or a situation affecting participant safety or autonomy. Record a minimal anonymised incident and refer to the designated human lead.

**P0 / release-blocking:** Any involuntary sharing; hidden location tracking; a claim that unknown/conditional evidence proves suitability; leakage of private drafts; inability to withdraw consent during research.

**P1 / release-blocking:** A task cannot be completed with the participant's chosen interaction method due to keyboard trap, non-operable input, inaccessible preview, obstructed focus or unrecoverable data loss; a participant reasonably mistakes "source-described" for a guarantee.

**P2:** Recoverable UI issues, confusing labels, unnecessary steps or poor error recovery. Address and re-test important flows before wider pilot.

**P3:** Personalisation preferences or cosmetic issues; co-design prioritisation.

**Proposed success decision (not measured):** No P0/P1 in the final re-test cohort; every participant can form a reasoned decision or express that more information is needed; every participant can decline sharing; representative input modes remain operable. A small sample cannot establish population-wide success or WCAG conformance.

## Standards and method

Apply **WCAG 2.2 AA** to the web app, platform accessibility expectations on native, and **ATAG 2.0 Parts A/B** to the question editor. The separate conformance audit remains mandatory.

Particularly inspect: keyboard (2.1.1), focus order/visibility/non-obscuration (2.4.3, 2.4.7, 2.4.11), reflow (1.4.10), text and non-text contrast (1.4.3, 1.4.11), target size (2.5.8), labels/instructions/errors (3.3.1–3.3.3), names/roles/values and status (4.1.2–4.1.3). ATAG Part A: perceivable and operable authoring interface, keyboard and editability; Part B: guidance to create meaningful, accessible content and review/repair before export.

W3C recommends combining standards audits with evaluation by disabled users, and warns against generalising from small participant groups:
- https://www.w3.org/WAI/test-evaluate/involving-users/
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/TR/ATAG20/

## Reporting and decisions

Publish only aggregated, non-identifying themes and participant-approved quotations. Keep a clear distinction between **automated code checks**, **facilitator observation**, **participant testimony** and **hypotheses**. Disclose participant count, access methods tested, prototype version/SHA, excluded scenarios, outstanding barriers and remaining non-tested methods. Do not merge or release solely because functional tests passed.

**Study status at authoring:** No participants recruited, no consent collected, no sessions conducted, no human findings available. This is a research-ready protocol pending governance approval.
