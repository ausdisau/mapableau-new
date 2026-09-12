# MapAble Communication Access Architecture

**Date:** 2026-09-12  
**Status:** Proposed design — approved architectural direction, not implemented  
**Repository:** `ausdisau/mapableau-new`  
**Upstream reference:** `ausdisau/project-euphonia-audiotool`  

## 1. Decision

MapAble will use `project-euphonia-audiotool` as an Apache-2.0 upstream research and implementation reference for its Communication Access and personalised-speech subsystem, while implementing a new provider-neutral, consent-first TypeScript architecture within MapAble rather than embedding the legacy Firebase application.

This design extends the existing MapAble participant experience in two coordinated directions:

1. **Unified participant shell** — one accessible participant-facing shell across `My MapAble` and service modules.
2. **Access Place Evidence Experience** — the first real evidence-backed place surface, initially powered by the National Public Toilet Map ingestion proof.
3. **Communication Access Layer** — reusable text, AAC, speech, personalised-speech, transcript-review, quick-phrase and read-aloud capabilities available across MapAble rather than isolated in a separate app.

## 2. Evidence and claim state

### Verified implementation context

- `app/my/layout.tsx` already gates an existing `UnifiedParticipantShell` behind `NEXT_PUBLIC_UNIFIED_SHELL`.
- `UnifiedParticipantShell` already composes shared header, sidebar, mobile navigation, participant controls, skip-to-content support and `@mapable/ui`'s `SidebarLayout`.
- `app/my/page.tsx` already renders real participant data using shared UI primitives including `PageHeader`, `Timeline`, `BookingRow`, `ModuleCard` and `AppGrid`.
- The MapAble repository already has an Access Graph / accessibility-data direction and an active NPTM ingestion proof in development.

### Verified upstream-reference context

The inspected `ausdisau/project-euphonia-audiotool` repository:

- describes itself as open-source research/reference code rather than an officially supported Google product;
- includes a web-based audio collection reference implementation;
- uses TypeScript, Firebase/GCP, Firestore, GCS, Firebase Authentication, Express and Node;
- defines participant, consent, task, taskset, recording and administration concepts;
- associates recordings with the consent IDs and versions in force when the sample was collected;
- is distributed under Apache License 2.0;
- uses an older dependency stack and is therefore unsuitable for direct embedding as a modern MapAble runtime.

### Explicit non-claims

This design does **not** claim:

- a Google partnership;
- a supported Google Project Euphonia API;
- production-ready personalised speech recognition;
- clinical validation;
- NDIS registration or NDIA integration;
- that the current NPTM ingestion PR is production ready.

## 3. Product purpose

Communication access is a core access requirement, not an optional voice feature.

The user-facing question is:

> How can MapAble let a person communicate, search, decide, report, request, correct and confirm in the mode that works for them — without forcing speech, diagnosis disclosure, or loss of control?

The Communication Access Layer must support people who use:

- standard text entry;
- AAC;
- non-standard or dysarthric speech;
- personalised speech recognition;
- quick phrases;
- text-to-speech / repeat-aloud assistance;
- mixed communication modes.

The person chooses the communication mode. MapAble must not infer diagnosis from speech samples or use communication data to determine eligibility, risk, capability or worth.

## 4. Architecture

```text
MapAble Participant Experience
│
├── UnifiedParticipantShell
│   ├── Global header and search
│   ├── My Access
│   ├── Desktop sidebar
│   ├── Mobile navigation
│   ├── Human-help pathway
│   └── Main content region
│
├── /my
│   └── Participant dashboard
│
├── /access/places/[placeId]
│   └── Access Place Evidence Experience
│       ├── Place summary
│       ├── Access features
│       ├── Access fit
│       ├── Evidence / freshness
│       ├── Conflicts
│       └── Report a change
│
└── Communication Access Layer
    ├── Text input
    ├── AAC input
    ├── Speech input
    ├── Personalised speech
    ├── Transcript review/correction
    ├── Quick phrases
    ├── Read aloud / repeat
    └── Human assistance
        │
        └── Speech Lab
            ├── Consent definitions / grants
            ├── Prompt sets
            ├── Speech samples
            ├── Dataset preparation
            ├── Model-training adapter
            └── Model-serving adapter
```

The Communication Access Layer is infrastructure shared by Access, Care, Transport, Jobs, Moves, Foods, messaging and other participant-facing modules.

## 5. Reuse the existing participant shell

The existing `UnifiedParticipantShell` remains the canonical base rather than creating a parallel shell.

### Target shell responsibilities

- MapAble branding and page identity;
- global search entry point;
- `My Access` entry point;
- participant/profile controls;
- desktop sidebar;
- mobile navigation;
- keyboard and screen-reader landmarks;
- skip-to-content;
- human-support access;
- consistent module navigation.

### Proposed shared shell components

```text
MapAbleParticipantShell
MapAbleGlobalHeader
MapAbleGlobalSearch
ParticipantSidebar
ParticipantMobileNav
MyAccessButton
HumanSupportAction
ParticipantPage
ParticipantPageHeader
ModuleNavItem
```

Where an equivalent component already exists, refactor/reuse it rather than adding a duplicate abstraction.

## 6. Access Place Evidence Experience

The NPTM place surface is the first concrete consumer of the shared shell and communication layer.

The participant-facing hierarchy is:

1. Can I use this place?
2. What exactly is reported?
3. How fresh is the information?
4. What evidence supports it?
5. Does it match my saved access requirements?
6. Are there conflicting observations?
7. Can I report what I found in my preferred communication mode?

### Proposed components

```text
AccessPlaceSummary
AccessFeatureProfile
AccessFeatureRow
AccessFitPanel
EvidenceStatusBadge
FreshnessIndicator
EvidenceDrawer
EvidenceTimeline
ConflictNotice
ReportAccessChange
AccessibleMapListToggle
```

The UI consumes a resolved Access Graph presentation model. It must not bind directly to raw NPTM CSV rows or expose ingestion internals.

### Evidence semantics

Public statuses:

- `reported`
- `community_reported`
- `corroborated`
- `verified`
- `disputed`
- `outdated`
- `not_confirmed`

`not_confirmed` must remain distinct from negative evidence. A false or blank government field must not be silently rendered as proof that a feature is absent when source semantics do not justify that conclusion.

Community evidence may confirm or dispute government evidence. Neither silently overwrites the other.

## 7. Communication Access domain model

### Communication modes

```ts
export type CommunicationInputMode =
  | "text"
  | "aac"
  | "speech"
  | "personalised_speech";
```

### Communication profile

```ts
export interface CommunicationProfile {
  id: string;
  principalId: string;
  preferredMode: CommunicationInputMode;
  locale: string;
  transcriptReviewRequired: boolean;
  readResponsesAloud: boolean;
  personalisedSpeechEnabled: boolean;
  activeSpeechModelId?: string;
  createdAt: string;
  updatedAt: string;
}
```

The profile records functional communication preferences, not diagnosis labels.

### Consent model

```ts
export type SpeechDataPurpose =
  | "speech_recognition_training"
  | "speech_recognition_evaluation"
  | "personalised_model"
  | "research";

export interface SpeechConsentGrant {
  id: string;
  communicationProfileId: string;
  consentDefinitionId: string;
  consentVersion: string;
  decision: "granted" | "declined" | "withdrawn";
  grantedAt?: string;
  withdrawnAt?: string;
  purposes: SpeechDataPurpose[];
}
```

Consent must be versioned and purpose-bound. A single mutable `consent: true` flag is prohibited.

### Speech samples

```ts
export interface SpeechSampleConsentSnapshot {
  consentDefinitionId: string;
  consentVersion: string;
}

export interface SpeechSample {
  id: string;
  communicationProfileId: string;
  promptId?: string;
  storageObjectId: string;
  expectedText?: string;
  participantTranscript?: string;
  locale: string;
  recordedAt: string;
  consent: SpeechSampleConsentSnapshot[];
  status:
    | "recorded"
    | "uploaded"
    | "reviewed"
    | "accepted"
    | "rejected"
    | "withdrawn";
}
```

Each sample preserves the exact consent snapshot in force at capture time.

### Prompt model

```ts
export type SpeechPromptType =
  | "read_phrase"
  | "free_response"
  | "image_description"
  | "quick_phrase";

export interface SpeechTrainingPrompt {
  id: string;
  promptSetId: string;
  type: SpeechPromptType;
  locale: string;
  text?: string;
  imageAssetId?: string;
  active: boolean;
}
```

## 8. Provider-neutral speech contracts

The participant UI must not know which ASR or storage implementation is active.

### Recognition adapter

```ts
export interface SpeechTranscript {
  text: string;
  confidence?: number;
  alternatives?: string[];
  modelId?: string;
  createdAt: string;
}

export interface SpeechRecognitionAdapter {
  readonly id: string;
  transcribe(input: {
    audioObjectId: string;
    communicationProfileId?: string;
    language: string;
  }): Promise<SpeechTranscript>;
}
```

Potential implementations may include device speech recognition, a future MapAble personalised model, or another approved speech service. No implementation is selected by this design.

### Speech object storage

```ts
export interface SpeechObjectStore {
  createUpload(input: {
    profileId: string;
    contentType: "audio/wav" | "audio/webm";
  }): Promise<{
    objectId: string;
    uploadUrl: string;
  }>;

  delete(objectId: string): Promise<void>;
}
```

Storage is private by default. The browser must not receive unrestricted listing access to a speech bucket/container.

### Personalised model engine

```ts
export interface PersonalisedSpeechEngine {
  train(input: {
    communicationProfileId: string;
    sampleIds: string[];
  }): Promise<SpeechTrainingJob>;

  transcribe(input: {
    communicationProfileId: string;
    audioObjectId: string;
  }): Promise<SpeechRecognitionResult>;
}
```

`SpeechTrainingJob` and `SpeechRecognitionResult` will be specified in the implementation plan. The interface intentionally avoids coupling the product layer to one ML platform.

## 9. Participant-facing components

```text
CommunicationAccessCard
CommunicationModeSelector
AccessibleSpeechInput
AudioCaptureButton
RecordingIndicator
TranscriptReview
TranscriptCorrectionPanel
ConfirmTranscriptButton
QuickPhrasePicker
RepeatWithVoice
AACLaunchButton
PersonalisedSpeechStatus
SpeechPrivacyControls
SpeechPromptCard
SpeechTrainingProgress
```

### Critical interaction rule

Speech recognition output is a proposal, not an action.

For consequential actions — transport booking, care request, access report, disclosure, message send, financial or safety-sensitive action — the transcript must be reviewable and confirmable before submission unless the participant has deliberately configured an equivalent accessible confirmation policy for that action class.

## 10. NPTM reporting flow with communication access

```text
Participant chooses Report a change
        ↓
Selects communication mode
        ↓
Text / AAC / speech / personalised speech
        ↓
Transcript or structured input
        ↓
Participant review/correction
        ↓
Participant confirms
        ↓
Structured access report
        ↓
AccessObservation
        ↓
Provenance + freshness + conflict handling
```

The speech model must never decide whether a toilet or venue is accessible. It may produce text. Deterministic application logic and participant-confirmed structured fields create the observation.

## 11. Privacy, security and rights boundaries

### Data minimisation

- Do not require diagnosis to enable communication modes.
- Store only the speech samples necessary for the participant-approved purpose.
- Separate raw audio, transcript, profile preferences and trained-model metadata.
- Do not repurpose speech samples for advertising, eligibility, worker assessment or unrelated analytics.
- Do not infer cognitive ability, competence, emotional state or diagnosis from speech samples.

### Consent and withdrawal

- Consent definitions are versioned.
- Purposes are explicit.
- Optional purposes remain optional.
- Withdrawal must stop future processing for the withdrawn purpose.
- Deletion/retention consequences must be explained before consent and withdrawal.
- Historical audit records may record that consent existed without retaining speech content beyond the applicable retention basis.

### Authorization

All speech-data operations require server-side authentication and authorization. Direct public bucket/database access is prohibited.

### Human support

A participant must always have a non-speech, non-AI path to complete core actions or ask for human assistance.

## 12. Accessibility requirements

WCAG 2.2 AA is the minimum digital conformance target, not the full usability definition.

Acceptance criteria include:

- complete keyboard operation;
- visible focus indication;
- logical heading and landmark structure;
- minimum 44×44 CSS-pixel target sizing for primary touch controls where feasible;
- no colour-only status communication;
- screen-reader announcements for recording, processing, transcript-ready, error and conflict states;
- 200% zoom and responsive reflow;
- reduced-motion support;
- captions/transcripts for audio playback controls;
- clear microphone permission errors and recovery;
- no timed response requirement for speech/AAC interactions;
- list alternative for map interactions;
- user-controlled transcript correction;
- plain-language consent summaries with access to full consent text;
- AAC-compatible labels and predictable focus order.

## 13. Visual system

The implementation should extend the existing MapAble design language rather than reproduce a screenshot literally.

- deep navy navigation/shell;
- white/off-white content surfaces;
- blue as the structural MapAble colour;
- module accents may differentiate Access, Care, Transport, Jobs, Moves and Foods;
- module colour never communicates evidence truth or accessibility status by itself;
- restrained rounded cards and clear hierarchy;
- participant controls and human support remain discoverable;
- evidence confidence and conflicts use text + iconography + semantics, not decorative badges alone.

## 14. Upstream Euphonia handling

### Allowed use

- architecture reference;
- consent/versioning patterns;
- prompt/task abstractions;
- recording lifecycle concepts;
- audio-capture implementation ideas;
- accessibility lessons;
- test and browser-compatibility lessons;
- Apache-2.0 source adaptation where useful and attributable.

### Not allowed as an architectural shortcut

- embedding the legacy Firebase app into MapAble;
- adopting old dependencies merely because the reference uses them;
- copying credentials or example secrets;
- exposing a public speech bucket;
- calling the result an official Google integration;
- treating research code as production security proof.

### Provenance requirement

Any directly adapted upstream source must preserve applicable Apache-2.0 notices and be recorded in MapAble's upstream/provenance documentation.

## 15. Proposed routes

Initial route set:

```text
/my
/my/access
/my/access/communication
/my/access/communication/speech
/my/access/communication/speech/train
/access/places/[placeId]
```

Administrative Speech Lab routes are intentionally deferred until participant capture/consent flows exist and operational ownership is defined.

## 16. Rollout sequence

### Slice 1 — Shared presentation contracts

- define communication types and provider-neutral interfaces;
- define Access Place presentation model;
- add non-networked component tests;
- no audio persistence;
- no model training.

### Slice 2 — Unified shell integration

- evolve existing `UnifiedParticipantShell`;
- global search + My Access entry point;
- communication-mode affordance without enabling unsupported providers;
- preserve existing feature flag / rollback path.

### Slice 3 — NPTM Access Place Evidence Experience

- render NPTM-derived Access Graph observations through typed presentation models;
- evidence/freshness/conflict UX;
- text/AAC-compatible report-a-change workflow;
- no personalised speech required.

### Slice 4 — Local/browser audio capture

- explicit microphone permission flow;
- record / stop / playback / re-record;
- transcript-review UI contract;
- private upload path only after consent and authorization are implemented.

### Slice 5 — Consent-first speech sample persistence

- versioned consent definitions/grants;
- speech sample metadata + consent snapshot;
- private object storage;
- deletion/withdrawal flows;
- audit events.

### Slice 6 — Personalised speech adapter

- provider-neutral engine implementation;
- training/evaluation pipeline;
- model activation and rollback;
- evaluation with people who use non-standard speech before any production default.

## 17. Testing strategy

### Unit

- communication preference validation;
- consent version/purpose rules;
- speech-sample consent snapshots;
- adapter contract behaviour;
- evidence-state presentation mapping;
- negative-vs-unknown NPTM semantics.

### Component

- keyboard recording controls;
- transcript correction;
- evidence/conflict announcements;
- My Access mode selection;
- report-a-change confirmation.

### Accessibility

- axe/automated WCAG checks;
- keyboard-only journeys;
- screen-reader landmarks and live regions;
- 200% zoom/reflow;
- reduced motion;
- map/list parity.

### Integration

- authenticated private upload flow;
- consent gate before persistence;
- withdrawal/deletion flow;
- NPTM report → AccessObservation with provenance;
- unsupported speech provider fallback to text/AAC.

### Human evaluation

Before production personalised speech is enabled, test with people who use dysarthric/non-standard speech and AAC. Evaluation must include correction effort, task completion, error recovery, fatigue, dignity, privacy comprehension and ability to abandon speech for another mode.

## 18. Failure handling

- Microphone denied → preserve text/AAC path and explain recovery.
- Recognition unavailable → keep captured audio local or discard according to explicit user choice; do not silently upload.
- Low-confidence transcript → require review; never fabricate missing words.
- Upload failure → allow retry or delete local capture.
- Consent unavailable/expired → block persistence and explain why.
- Model unavailable → fall back to an approved alternate mode.
- Evidence conflict → surface both assertions rather than overwrite.
- Service outage → preserve non-AI core task path where possible.

## 19. Observability and audit

Audit events should record, without storing unnecessary speech content:

- consent granted/declined/withdrawn;
- recording created/deleted;
- upload created/completed/failed;
- transcript confirmed/corrected;
- model training requested/completed/failed;
- model activated/deactivated;
- access report submitted;
- human-support escalation requested.

Operational metrics must avoid ranking or scoring participants by speech quality.

## 20. Non-goals for first implementation

- autonomous diagnosis;
- clinical speech assessment;
- emotion detection;
- participant risk scoring;
- worker/employer assessment from voice;
- automatic submission of speech-recognised consequential actions without confirmation;
- migration of the Euphonia Firebase backend;
- public speech datasets;
- unrestricted administrator access to raw recordings;
- production personalised model training before privacy, consent, deletion and evaluation controls exist.

## 21. Implementation-readiness gates

Before implementation proceeds beyond the design stage:

1. User reviews and approves this written spec.
2. A Superpowers implementation plan is written.
3. Work begins in an isolated branch/worktree.
4. TDD is used for implementation slices.
5. Current MapAble CI/security state is checked so new failures are separated from baseline failures.
6. No production flag is enabled without explicit approval.
7. No upstream research code is represented as an official Google-supported integration.

## 22. Open implementation decisions deferred to planning

These are implementation choices, not unresolved product requirements:

- exact database table/model names;
- object-storage provider;
- first speech-recognition provider;
- server transport for audio upload;
- precise route grouping if current route ownership suggests a cleaner placement;
- whether shared communication primitives live in `packages/ui` or a MapAble domain package;
- exact model-evaluation thresholds;
- administrative Speech Lab ownership and roles.

Each decision must preserve the interfaces, consent rules, participant control and provider-neutral boundaries in this design.
