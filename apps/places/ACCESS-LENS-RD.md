# MapAble Places R&D: Evidence Lens and community-access readiness

**November 2026 | Experimental prototype, no claims of production deployment, clinical/access certification or CripSquare integration.**

## The research decision

Explore whether people with different access needs can make a *better informed, self-directed decision* about visiting a place by using specific source evidence and accessible pre-visit questions, instead of an opaque universal accessibility score or public location check-in.

This is the next experimental slice of the merged MapAble Places prototype (PR #623), not a replacement for MapAble's canonical \`AccessPlace\` or a live accessibility certification layer.

## Built in this branch

- \`src/access-lens.ts\`: deterministic five-feature evidence interpretation; explicit \`source-described\`, \`conditional\`, and \`not-assessed\` states. No hidden numerical scores, personal medical inference, GPS, LLMs, telemetry or automatic decisions about individual suitability.
- \`src/AccessLensPanel.tsx\`: optional, labelled in-context evidence view and questions draft, with explicit review and OS share action. Feature selection stays in component memory, **not in AsyncStorage**.
- \`src/ExploreScreen.tsx\`: an AccessFit action for each place without adding new bottom tabs or a mandatory check-in.
- \`src/CommunityScreen.tsx\`: the same evidence/checklist function inside fictional CripSquare gathering planning. It does **not** create events, send invitations, RSVP or share membership.
- \`tests/access-lens.test.mjs\`: domain tests covering uncertainty, source attribution, data minimisation and deterministic output.

Selected features: step-free entrance, accessible toilet, communication access, sensory/quiet areas, and accessible transport approach. Current data only supports the first two in the curated demo; *communication, sensory and transport remain unknown* until a future feature-level evidence source is added.

### Why this is ethically distinctive

The service answers **"What do we know, what remains uncertain, and what could I ask?"**, not **"Is this person allowed or able to go there?"**. Participants can use the tool without disclosure. Source status is attached to *each feature*, not turned into a score for a person or venue.

Public MapAble directory entries deliberately do not inherit verification claims from category tags, review scores, or the existence of a published record. Even \`documented\` means **a source describes the feature**, not a guarantee that it suits a particular person, that lifts are operating, or that all parts of a trip are step-free.

### Sharing/data flow

\`\`\`text
MapAble published directory ─read-only→ local evidence lens
                                      ↓
                             selected feature toggles
                             (transient local UI state)
                                      ↓
                  explanatory evidence + venue questions draft
                                      ↓
                human review + explicit OS share sheet [optional]
\`\`\`

No server write, diagnosis, direct-message automation, location tracking, event attendance evidence, advertising profile, or CripSquare posts. The user-selected question topics can nevertheless reveal something about interests or functional requirements **if the user chooses to send them**; the interface must say this clearly.

## Grounding

- W3C ATAG 2.0, https://www.w3.org/TR/ATAG20/ — Part A accessibility of authorship interface, Part B support for accessible outputs, including informative prompts and review.
- WCAG 2.2, https://www.w3.org/TR/WCAG22/ — target web AA and supplementary native accessibility requirements. Our preferred ≥44 px controls are a design target beyond some normative target-size minimums.
- OAIC updated APP 3 guidance (May 2026), https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information — data minimisation, proportionality and purpose limitation.

## Co-design hypotheses, not measured results

| Hypothesis | Research method | Decision threshold (proposed) |
|---|---|---|
| Feature-level evidence improves usable planning decisions | Compare participants' decisions with and without evidence lens in a synthetic venue scenario | Fewer unsupported assumptions and more relevant questions |
| Explicit unknown state helps avoid overclaiming | Show contradictory and stale fixture entries; observe confidence calibration | Zero participants incorrectly interpret "source-described" as independently verified |
| Asking a venue need not reveal medical history | Review exported draft for identifiers and diagnostic language with participants | Zero auto-added identifiers; opt-in share is understood |
| CripSquare planning can promote belonging without location exposure | Simulated event planning with no real venue/attendees | Users can plan and decline without membership or attendance publication |
| ATAG authoring support increases autonomy | NVDA, VoiceOver, TalkBack, keyboard/switch/AAC usability sessions | Users can edit questions and complete pre-visit planning without assistance unless chosen |

Thresholds are preliminary and need agreement with disability-led participants; do not treat them as measured outcomes.

## Candidate R&D horizons

1. **H0 — built in branch:** Evidence Lens + locally generated venue questions + example gathering readiness.
2. **H1 — prototype next:** verified feature-level \`AccessObservation\` adapter with source dates, conflicting evidence and human-reviewed correction requests. Conflicts must not be averaged into false certainty.
3. **H1/H2 — co-design:** optional user-edited access request kit, AAC-friendly templates, personal preferences stored securely only with explicit opt-in, route-segment evidence completeness.
4. **H2 — partnership experiment:** venue response and correction loop with scoped moderation, retention, safety escalation and privacy impact assessment. No paid verification bias.
5. **H3+ — exploratory:** federated CripSquare community Spaces/event links across organisations with explicit per-action consent and independent safeguards; never a universal location graph.

## Manual test protocol before promotion

Use scripted fictional venue tasks with participants with physical, communication, sensory, cognitive and other disabilities (including switch control and AAC). Run desktop NVDA/Firefox, iOS VoiceOver, Android TalkBack, mobile text enlargement, 200%/400% reflow, keyboard-only and offline-state checks. Measure completion, error recovery, cognitive effort and decision confidence *without creating personal location traces*.

Keep improvements in a **separate draft PR** until app CI passes and human accessibility, privacy, and safeguarding reviews complete. Never merge a simulated access conclusion into the canonical AccessPlace verification system.
