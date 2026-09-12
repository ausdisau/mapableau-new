# MapAble Labs Communication Platform Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate MapAble's existing Communication Passport, AAC, voice, speech and participant-access capabilities into a single MapAble Labs Communication Platform with Australian-only sensitive-data residency, Essential Eight-aligned security, consent-first speech collection and a provider-neutral personalised-speech path derived from Project Euphonia research patterns.

**Architecture:** Keep `labs.mapable.com.au` as the participant-facing experimental origin and reuse the existing Next.js Labs shell, Communication Passport, AAC services, voice confirmation gates and platform speech contracts. Sensitive speech content is handled by a separate Australian-resident communication data plane in AWS `ap-southeast-2` with Australian DR in `ap-southeast-4`; raw audio never transits generic Vercel API routes. Existing MapAble communication preferences remain canonical; Labs adds speech-specific consent, capture, training and inference capabilities without creating a competing participant identity or passport.

**Tech Stack:** Next.js, React, TypeScript, Prisma/PostgreSQL, existing `@mapable/ui`, Node.js service workspace, AWS Sydney/Melbourne infrastructure via existing OpenTofu/Terraform-compatible `infra/`, S3-compatible object storage, SQS, KMS, WAF, CloudWatch, Vitest, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-12-mapable-communication-access-design.md` plus `docs/superpowers/specs/2026-09-12-mapable-communication-labs-security-addendum.md`

## Global Constraints

- MapAble Labs is experimental and must remain visibly distinct from validated production services.
- Participant-facing Labs route: `https://labs.mapable.com.au/communication`; direct preview/testing route: `/labs/communication`.
- Sensitive communication content must be stored and processed only in Australia.
- Primary sensitive-data region: AWS `ap-southeast-2` (Sydney).
- Disaster-recovery region: AWS `ap-southeast-4` (Melbourne).
- Raw audio, transcript content, participant-linked model artefacts and sensitive communication content must not be persisted in Vercel storage or logs.
- Raw audio must not transit a generic Next.js/Vercel API route.
- Essential Eight target before a production-style persistent-data pilot: Maturity Level 2 for the supporting environment; do not claim certification from code alone.
- WCAG 2.2 AA is the minimum digital accessibility target.
- Speech difficulty must never imply reduced decision-making capacity.
- Consequential voice/speech actions require accessible participant confirmation; `voiceBypassConfirmationEnabled` remains hardcoded `false`.
- `AccessibilityProfile` remains presentation/access-preference infrastructure; do not create a second participant identity.
- Reconcile existing Communication Passport implementations before adding new participant communication persistence.
- Project Euphonia code is an Apache-2.0 upstream research/reference source, not an official Google integration or supported API.
- No speech data may be used for advertising, eligibility, capability scoring, emotional inference or unrelated profiling.
- All feature flags default off and all residency/security checks fail closed.
- Production deployment, custom domains, persistent speech collection and model activation require separate explicit approval.

---

## Programme decomposition

Implement this as seven independently reviewable pull-request slices. Do not put all work in one branch.

1. **PR 1 — Canonical communication core and Labs shell**
2. **PR 2 — Australian residency/security enclave**
3. **PR 3 — Consent-first speech capture and storage**
4. **PR 4 — Recognition adapters and personalised-speech research**
5. **PR 5 — Access/NPTM and cross-module communication integration**
6. **PR 6 — Essential Eight evidence, privacy, resilience and operational controls**
7. **PR 7 — Labs pilot, accessibility validation and promotion gates**

Each PR remains draft until its own tests and review evidence are complete.

---

### Task 1: Freeze the canonical Communication Platform source-of-truth contract

**Files:**
- Create: `lib/communication/platform-contracts.ts`
- Create: `tests/communication/platform-contracts.test.ts`
- Modify: `lib/communication/communication-passport-service.ts`
- Modify: `lib/support/communication-passport/service.ts`
- Modify: `docs/careos/mobile-communication.md`

**Interfaces:**
- Consumes: existing `AccessibilityProfile`, database-backed `CommunicationPassport`, `PreferredQuestion`, `SavedPhrase`, `AacMethodPreference`, `EmergencyCommunicationCard`.
- Produces: `CanonicalCommunicationContext`, `getCanonicalCommunicationContext(participantId)`, `CommunicationInputMode`.

- [ ] **Step 1: Write the failing canonical-source test**

```ts
import { describe, expect, it } from "vitest";
import { COMMUNICATION_CANON } from "@/lib/communication/platform-contracts";

describe("Communication Platform canon", () => {
  it("does not invent a second participant or passport source of truth", () => {
    expect(COMMUNICATION_CANON.participantIdentity).toBe("User");
    expect(COMMUNICATION_CANON.presentationPreferences).toBe("AccessibilityProfile");
    expect(COMMUNICATION_CANON.communicationRecord).toBe("CommunicationPassport");
    expect(COMMUNICATION_CANON.speechDifficultyImpliesCapacityReduction).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm vitest run tests/communication/platform-contracts.test.ts`

Expected: FAIL because `platform-contracts.ts` does not exist.

- [ ] **Step 3: Implement the minimal canonical contract**

```ts
export type CommunicationInputMode =
  | "text"
  | "aac"
  | "speech"
  | "personalised_speech";

export const COMMUNICATION_CANON = {
  participantIdentity: "User",
  presentationPreferences: "AccessibilityProfile",
  communicationRecord: "CommunicationPassport",
  speechDifficultyImpliesCapacityReduction: false,
} as const;

export interface CanonicalCommunicationContext {
  participantId: string;
  passportId: string | null;
  modes: CommunicationInputMode[];
  savedPhrases: Array<{ id: string; label: string; text: string }>;
  requiresExtraResponseTime: boolean;
}
```

Implement `getCanonicalCommunicationContext(participantId)` by composing existing services rather than copying records into a new table. During migration, database-backed `CommunicationPassport` supplies long-form passport/AAC content while `AccessibilityProfile` supplies legacy presentation flags; document this transition explicitly.

- [ ] **Step 4: Add regression tests for both existing passport paths**

Test that a participant with legacy `AccessibilityProfile.communicationPreferences=["aac"]` and a database-backed passport receives one canonical context without duplicate phrase/mode rows.

- [ ] **Step 5: Run communication tests**

Run: `pnpm vitest run tests/communication tests/communication-workforce`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/communication lib/support/communication-passport tests/communication tests/communication-workforce docs/careos/mobile-communication.md
git commit -m "refactor(communication): establish canonical platform context"
```

---

### Task 2: Add MapAble Labs Communication shell and fail-closed feature flags

**Files:**
- Create: `app/labs/communication/page.tsx`
- Create: `components/labs/communication/CommunicationLabHome.tsx`
- Create: `lib/config/labs-communication.ts`
- Create: `tests/labs/communication-flags.test.ts`
- Modify: `app/labs/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: existing `ExperimentShell`, MapAble Labs routing, `CanonicalCommunicationContext`.
- Produces: `labsCommunicationConfig`, `ensureLabsCommunicationEnabled()`.

- [ ] **Step 1: Write failing flag tests**

```ts
import { describe, expect, it } from "vitest";
import { labsCommunicationConfig } from "@/lib/config/labs-communication";

describe("Labs Communication flags", () => {
  it("fails closed by default", () => {
    expect(labsCommunicationConfig.enabled).toBe(false);
    expect(labsCommunicationConfig.captureEnabled).toBe(false);
    expect(labsCommunicationConfig.personalisedSpeechEnabled).toBe(false);
    expect(labsCommunicationConfig.researchEnabled).toBe(false);
    expect(labsCommunicationConfig.auResidencyRequired).toBe(true);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/communication-flags.test.ts`

Expected: FAIL because config is absent.

- [ ] **Step 3: Implement flags**

```ts
function enabled(name: string): boolean {
  return process.env[name] === "true";
}

export const labsCommunicationConfig = {
  enabled: enabled("MAPABLE_LABS_COMMUNICATION_ENABLED"),
  captureEnabled: enabled("MAPABLE_LABS_SPEECH_CAPTURE_ENABLED"),
  personalisedSpeechEnabled: enabled("MAPABLE_LABS_PERSONALISED_SPEECH_ENABLED"),
  researchEnabled: enabled("MAPABLE_LABS_SPEECH_RESEARCH_ENABLED"),
  auResidencyRequired: true,
} as const;
```

Add all flags to `.env.example` as `false` except the hardcoded residency requirement, which is not an environment override.

- [ ] **Step 4: Implement Labs UI shell**

Render `ExperimentShell` with status copy: `Experimental — participant-controlled communication research`. Expose text/AAC features first; disabled speech cards explain that capture is unavailable until consent and Australian-resident storage are enabled.

- [ ] **Step 5: Add source-inspection accessibility test**

Verify the page contains a single `h1`, visible experimental status, no voice-only control, and a human-help/non-speech path.

- [ ] **Step 6: Run tests and type-check**

Run:

```bash
pnpm vitest run tests/labs/communication-flags.test.ts tests/labs
pnpm type-check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/labs components/labs/communication lib/config/labs-communication.ts tests/labs .env.example
git commit -m "feat(labs): add communication platform shell"
```

---

### Task 3: Encode Australian residency as an executable policy

**Files:**
- Create: `lib/labs/communication/residency-policy.ts`
- Create: `tests/labs/communication-residency.test.ts`
- Create: `docs/security/communication-data-residency.md`

**Interfaces:**
- Produces: `AU_COMMUNICATION_REGIONS`, `CommunicationDataClass`, `assertCommunicationRegion(region)`, `assertCommunicationTelemetrySafe(payloadKeys)`.

- [ ] **Step 1: Write failing residency tests**

```ts
import { describe, expect, it } from "vitest";
import {
  assertCommunicationRegion,
  AU_COMMUNICATION_REGIONS,
} from "@/lib/labs/communication/residency-policy";

describe("communication residency", () => {
  it("permits only Australian platform regions", () => {
    expect(AU_COMMUNICATION_REGIONS).toEqual([
      "ap-southeast-2",
      "ap-southeast-4",
    ]);
    expect(() => assertCommunicationRegion("ap-southeast-2")).not.toThrow();
    expect(() => assertCommunicationRegion("us-east-1")).toThrow("COMMUNICATION_REGION_NOT_AUSTRALIA");
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/communication-residency.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement the policy**

```ts
export const AU_COMMUNICATION_REGIONS = [
  "ap-southeast-2",
  "ap-southeast-4",
] as const;

export type CommunicationDataClass =
  | "public_experiment"
  | "participant_preferences"
  | "speech_audio"
  | "speech_transcript"
  | "consent"
  | "training_dataset"
  | "model_artifact"
  | "participant_audit";

export function assertCommunicationRegion(region: string): void {
  if (!AU_COMMUNICATION_REGIONS.includes(region as (typeof AU_COMMUNICATION_REGIONS)[number])) {
    throw new Error("COMMUNICATION_REGION_NOT_AUSTRALIA");
  }
}
```

Document that Vercel may serve static/user-interface code, but sensitive content must not be included in Vercel logs, storage, analytics events or generic API payloads.

- [ ] **Step 4: Add telemetry key denylist test**

Deny `audio`, `audioUrl`, `transcript`, `savedPhrase`, `medicalNotes`, `communicationNeeds`, `participantId`, `modelArtifact`, and any raw request body from third-party telemetry exporters.

- [ ] **Step 5: Run test and commit**

```bash
pnpm vitest run tests/labs/communication-residency.test.ts
git add lib/labs/communication tests/labs docs/security/communication-data-residency.md
git commit -m "feat(security): enforce communication data residency policy"
```

---

### Task 4: Build the Australian-resident Communication Enclave in existing IaC

**Files:**
- Create: `infra/modules/labs-communication/main.tf`
- Create: `infra/modules/labs-communication/variables.tf`
- Create: `infra/modules/labs-communication/outputs.tf`
- Create: `infra/labs-communication.tf`
- Modify: `infra/variables.tf`
- Modify: `infra/environments/staging.tfvars`
- Modify: `infra/environments/production.tfvars`
- Modify: `tests/infra/hcl-modules.test.ts`

**Interfaces:**
- Consumes: existing AWS provider, `primary_region`, `dr_region`, common tags.
- Produces: encrypted private object storage, KMS key, metadata PostgreSQL endpoint/secret reference, queue/DLQ, application service target, Australian-only backup policy.

- [ ] **Step 1: Extend infra tests before adding HCL**

Add source-inspection assertions that `infra/modules/labs-communication/main.tf` must contain public-access blocking, KMS encryption, `prevent_destroy` for production data resources, no `us-*`/`eu-*` region strings, and no cross-region replication outside `ap-southeast-4`.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/infra/hcl-modules.test.ts`

Expected: FAIL because module is absent.

- [ ] **Step 3: Implement the module**

Minimum resources:

```hcl
resource "aws_kms_key" "communication" {
  description             = "MapAble Labs communication data"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "speech" {
  bucket = "${var.environment}-mapable-labs-communication-speech"
}

resource "aws_s3_bucket_public_access_block" "speech" {
  bucket                  = aws_s3_bucket.speech.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "speech" {
  bucket = aws_s3_bucket.speech.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.communication.arn
    }
  }
}
```

Use the existing PostgreSQL/application/queue/backups patterns rather than creating internet-exposed database resources. Production uses Sydney primary and Melbourne DR only.

- [ ] **Step 4: Add an Australian-region invariant**

`infra/labs-communication.tf` must reject a non-Australian `primary_region` or `dr_region` using variable validation/preconditions.

- [ ] **Step 5: Run IaC validation**

Run:

```bash
pnpm vitest run tests/infra/hcl-modules.test.ts
cd infra && tofu fmt -check -recursive && tofu validate
```

Expected: PASS without a live apply.

- [ ] **Step 6: Commit**

```bash
git add infra tests/infra
git commit -m "feat(infra): add Australian communication data enclave"
```

**Deployment gate:** Do not run `tofu apply` as part of this task. Live cloud creation requires explicit approval and environment/account verification.

---

### Task 5: Create the Australian Communication API service boundary

**Files:**
- Create: `apps/labs-communication-service/package.json`
- Create: `apps/labs-communication-service/tsconfig.json`
- Create: `apps/labs-communication-service/src/server.ts`
- Create: `apps/labs-communication-service/src/config.ts`
- Create: `apps/labs-communication-service/src/auth/capability-token.ts`
- Create: `apps/labs-communication-service/src/routes/health.ts`
- Create: `apps/labs-communication-service/src/routes/uploads.ts`
- Create: `tests/labs/communication-service-contract.test.ts`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- `POST /v1/uploads` -> short-lived signed AU object-storage upload descriptor.
- `GET /healthz` -> no participant data.
- Capability token contains opaque subject, allowed operation, expiry and nonce only.

- [ ] **Step 1: Write failing service-contract tests**

Assert that upload descriptors never expose bucket-list permissions, expiry is <= 10 minutes, object keys contain an opaque generated ID rather than email/name, and config refuses any region not allowed by `AU_COMMUNICATION_REGIONS`.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/communication-service-contract.test.ts`

Expected: FAIL.

- [ ] **Step 3: Add the workspace service**

Use Node/TypeScript with a narrow HTTP surface. Add AWS SDK S3/presigner dependencies only to this workspace. Do not import the Euphonia Firebase/Express dependency stack.

- [ ] **Step 4: Implement fail-closed config**

```ts
export function loadCommunicationServiceConfig(env: NodeJS.ProcessEnv) {
  const region = env.AWS_REGION ?? "";
  if (region !== "ap-southeast-2" && region !== "ap-southeast-4") {
    throw new Error("COMMUNICATION_REGION_NOT_AUSTRALIA");
  }
  if (!env.COMMUNICATION_UPLOAD_BUCKET) {
    throw new Error("COMMUNICATION_UPLOAD_BUCKET_REQUIRED");
  }
  return { region, bucket: env.COMMUNICATION_UPLOAD_BUCKET } as const;
}
```

- [ ] **Step 5: Implement signed upload creation**

Requirements: authenticated capability, content types restricted to approved audio formats, maximum byte size enforced before signing, object key generated server-side, KMS encryption required, no public ACL.

- [ ] **Step 6: Run tests and type-check**

```bash
pnpm vitest run tests/labs/communication-service-contract.test.ts
pnpm --filter @mapable/labs-communication-service exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/labs-communication-service pnpm-workspace.yaml pnpm-lock.yaml tests/labs
git commit -m "feat(communication): add Australian Labs data-plane service"
```

---

### Task 6: Add versioned consent and immutable speech-sample consent snapshots

**Files:**
- Modify: `prisma/schema.prisma` only for core references if necessary; do not store raw Labs audio there.
- Create: `apps/labs-communication-service/prisma/schema.prisma`
- Create: `apps/labs-communication-service/prisma/migrations/0001_consent_speech_samples/migration.sql`
- Create: `apps/labs-communication-service/src/domain/consent.ts`
- Create: `apps/labs-communication-service/src/domain/speech-sample.ts`
- Create: `tests/labs/communication-consent.test.ts`

**Interfaces:**
- Produces: `SpeechConsentDefinition`, `SpeechConsentDecision`, `SpeechSampleConsentSnapshot`, `SpeechSample`.

- [ ] **Step 1: Write failing consent snapshot tests**

```ts
it("freezes consent versions onto every persisted sample", () => {
  const snapshot = snapshotConsent([
    { definitionId: "speech-training", version: "2026-09-12", decision: "granted" },
  ]);
  expect(snapshot).toEqual([
    { definitionId: "speech-training", version: "2026-09-12" },
  ]);
});
```

Also test that a missing required speech-capture purpose prevents sample creation.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/communication-consent.test.ts`

- [ ] **Step 3: Define service-local speech schema**

Required tables: consent definitions/versions, participant consent decisions, speech samples, sample consent snapshots, prompt sets/prompts, model jobs, model artefacts and deletion requests. Store opaque MapAble participant/passport references, never email/NDIS identifiers.

- [ ] **Step 4: Implement purpose checks**

Separate purposes:

```ts
export type SpeechDataPurpose =
  | "capture_for_transcription"
  | "personalised_model_training"
  | "model_evaluation"
  | "research";
```

`research` and `personalised_model_training` are optional and independently revocable.

- [ ] **Step 5: Implement withdrawal state machine**

Withdrawal stops future processing immediately, marks affected queued jobs ineligible, queues live-object deletion according to policy, and records the backup-retention consequence separately.

- [ ] **Step 6: Run migration validation and tests**

```bash
pnpm vitest run tests/labs/communication-consent.test.ts
pnpm --filter @mapable/labs-communication-service exec prisma validate
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/labs-communication-service tests/labs prisma/schema.prisma
git commit -m "feat(communication): add versioned speech consent lifecycle"
```

---

### Task 7: Build accessible browser recording, playback and transcript review

**Files:**
- Create: `components/labs/communication/AccessibleAudioRecorder.tsx`
- Create: `components/labs/communication/TranscriptReview.tsx`
- Create: `components/labs/communication/CommunicationModeSelector.tsx`
- Create: `app/labs/communication/speech/page.tsx`
- Create: `tests/accessibility/labs-communication.spec.ts`
- Create: `tests/labs/audio-recorder.test.tsx`

**Interfaces:**
- Consumes: signed upload descriptor from AU service.
- Produces: participant-confirmed transcript only; raw recording remains in AU object storage.

- [ ] **Step 1: Write failing component tests**

Test states: permission-required, recording, stopped, playback, re-record, upload-in-progress, transcript-ready, transcript-edited, confirmed, error. Assert every state exposes text to assistive technology.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/audio-recorder.test.tsx`

- [ ] **Step 3: Implement recorder state machine**

Do not auto-start the microphone. A user gesture must request permission. Recording has explicit Start/Stop buttons, visible and screen-reader status, no time limit, and a keyboard-accessible re-record path.

- [ ] **Step 4: Implement transcript confirmation**

`TranscriptReview` must allow edit/correct before confirmation. It emits:

```ts
export type ConfirmedTranscript = {
  text: string;
  confirmedAt: string;
  source: "speech" | "personalised_speech";
};
```

No consequential MapAble action accepts unconfirmed recognition output.

- [ ] **Step 5: Run component + Playwright accessibility tests**

```bash
pnpm vitest run tests/labs/audio-recorder.test.tsx
pnpm playwright test tests/accessibility/labs-communication.spec.ts
```

Expected: PASS for keyboard, focus, status announcements, 200% zoom/reflow and no colour-only status.

- [ ] **Step 6: Commit**

```bash
git add app/labs/communication components/labs/communication tests/labs tests/accessibility
git commit -m "feat(labs): add accessible speech capture and review"
```

---

### Task 8: Extend existing platform speech contracts instead of creating a parallel adapter stack

**Files:**
- Modify: `lib/platform/speech/speech-contracts.ts`
- Modify: `lib/platform/speech/browser-provider.ts`
- Create: `lib/platform/speech/remote-au-provider.ts`
- Create: `tests/communication/speech-providers.test.ts`

**Interfaces:**
- Existing: `SpeechRecognitionProvider`, `SpeechTranscript`, `SpeechSynthesisProvider`.
- Add: `SpeechRecognitionContext`, optional `participantProfileRef`, explicit provider provenance.

- [ ] **Step 1: Write failing provider tests**

Test browser provider fails closed when unsupported and remote AU provider refuses a non-Australian endpoint hostname/configuration.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/communication/speech-providers.test.ts`

- [ ] **Step 3: Evolve contracts compatibly**

```ts
export interface SpeechRecognitionContext {
  locale: string;
  mode: "generic" | "personalised";
  communicationProfileRef?: string;
}

export interface SpeechTranscript {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: string;
  provider: string;
  modelRef?: string;
}
```

Preserve existing start/stop/listener behaviour; add the minimum context hooks required for AU remote/personalised recognition.

- [ ] **Step 4: Implement remote provider**

Provider talks only to the AU communication service, emits no transcript to analytics, and returns provider/model provenance for participant review.

- [ ] **Step 5: Run all communication tests**

Run: `pnpm vitest run tests/communication tests/communication-workforce`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/platform/speech tests/communication
git commit -m "feat(speech): add Australian recognition provider contract"
```

---

### Task 9: Add Project Euphonia provenance and training-data import boundary

**Files:**
- Create: `docs/upstream/project-euphonia.md`
- Create: `apps/labs-communication-service/src/euphonia/reference-contract.ts`
- Create: `apps/labs-communication-service/src/euphonia/import-validator.ts`
- Create: `tests/labs/euphonia-boundary.test.ts`

**Interfaces:**
- Produces only schema/architecture compatibility helpers; no Firebase runtime dependency.

- [ ] **Step 1: Write failing boundary tests**

Assert the Labs workspace package tree does not depend on `firebase`, `firebase-admin`, `firebase-functions` or the legacy Euphonia app package. Assert imported metadata must carry Apache-2.0 provenance and explicit participant consent purpose.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/euphonia-boundary.test.ts`

- [ ] **Step 3: Implement provenance document and validator**

Document upstream repository, licence, what was adapted, what was not imported, and the non-partnership claim. Map Euphonia concepts (`EUID`, consent version, taskset, recording) to MapAble opaque participant refs, consent definitions, prompt sets and speech samples.

- [ ] **Step 4: Run test and dependency audit**

```bash
pnpm vitest run tests/labs/euphonia-boundary.test.ts
pnpm audit --prod
```

Expected: boundary test PASS; no new vulnerable legacy Firebase dependency chain introduced.

- [ ] **Step 5: Commit**

```bash
git add docs/upstream apps/labs-communication-service/src/euphonia tests/labs
git commit -m "docs(communication): govern Euphonia upstream boundary"
```

---

### Task 10: Implement personalised-speech training and inference jobs behind a disabled flag

**Files:**
- Create: `apps/labs-communication-service/src/domain/model-job.ts`
- Create: `apps/labs-communication-service/src/queue/model-job-queue.ts`
- Create: `apps/labs-communication-service/src/providers/personalised-speech-engine.ts`
- Create: `apps/labs-communication-service/src/providers/disabled-engine.ts`
- Create: `tests/labs/personalised-speech-engine.test.ts`

**Interfaces:**
- Produces: `PersonalisedSpeechEngine`, `SpeechTrainingJob`, `SpeechRecognitionResult`.

- [ ] **Step 1: Write failing safety tests**

Verify training refuses: missing training consent, withdrawn consent, samples from multiple participant refs, non-Australian worker region, fewer than the configured minimum accepted samples, or a disabled personalised-speech flag.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/personalised-speech-engine.test.ts`

- [ ] **Step 3: Implement engine contract**

```ts
export interface PersonalisedSpeechEngine {
  train(input: {
    participantRef: string;
    sampleIds: string[];
  }): Promise<SpeechTrainingJob>;

  transcribe(input: {
    participantRef: string;
    audioObjectId: string;
  }): Promise<SpeechRecognitionResult>;
}
```

Default provider is `DisabledPersonalisedSpeechEngine`; it throws `PERSONALISED_SPEECH_DISABLED`.

- [ ] **Step 4: Implement queue contract, not a production ML model**

Queue jobs with region, consent snapshot hash, dataset manifest hash and requested model provider. Do not select/activate a production ASR model in this PR.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/labs/personalised-speech-engine.test.ts
git add apps/labs-communication-service tests/labs
git commit -m "feat(speech): add governed personalised model job contracts"
```

---

### Task 11: Connect Communication Platform to Access Place/NPTM reporting

**Files:**
- Create: `components/access/evidence/ReportAccessChange.tsx`
- Create: `lib/access/presentation/access-place-model.ts`
- Modify: `lib/access/infrastructure/observation-service.ts`
- Create: `tests/access-infrastructure/communication-reporting.test.ts`
- Create: `app/access/places/[placeId]/page.tsx` if no canonical equivalent exists at execution time.

**Interfaces:**
- Consumes: confirmed text/AAC/speech input.
- Produces: structured `AccessObservationRecord` only after participant confirmation.

- [ ] **Step 1: Write failing observation-boundary test**

Assert an unconfirmed speech transcript cannot create an observation, while a participant-confirmed structured report can.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/access-infrastructure/communication-reporting.test.ts`

- [ ] **Step 3: Implement presentation model**

Expose `reported`, `community_reported`, `corroborated`, `verified`, `disputed`, `outdated`, `not_confirmed`. Never convert unknown NPTM data into negative evidence.

- [ ] **Step 4: Implement multimodal report UI**

Modes: text, AAC/saved phrase, generic speech, personalised speech when enabled. All modes converge on the same participant-confirmed structured report.

- [ ] **Step 5: Run NPTM/access regression suite**

```bash
pnpm vitest run tests/access-infrastructure
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/access lib/access app/access tests/access-infrastructure
git commit -m "feat(access): accept confirmed multimodal accessibility reports"
```

---

### Task 12: Integrate the Communication Platform across Care, Transport, Jobs and Messaging without duplicating business logic

**Files:**
- Create: `lib/communication/action-confirmation.ts`
- Create: `components/communication/AccessibleCommunicationInput.tsx`
- Modify only existing module forms/routes selected by repository inspection at execution time.
- Create: `tests/communication/action-confirmation.test.ts`

**Interfaces:**
- `AccessibleCommunicationInput` returns confirmed participant text plus provenance.
- `requiresCommunicationConfirmation(actionClass)` is deterministic.

- [ ] **Step 1: Write failing consequence-classification tests**

```ts
expect(requiresCommunicationConfirmation("read_only_search")).toBe(false);
expect(requiresCommunicationConfirmation("send_message")).toBe(true);
expect(requiresCommunicationConfirmation("book_transport")).toBe(true);
expect(requiresCommunicationConfirmation("submit_care_request")).toBe(true);
expect(requiresCommunicationConfirmation("submit_job_application")).toBe(true);
```

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/communication/action-confirmation.test.ts`

- [ ] **Step 3: Implement deterministic confirmation policy**

Reuse `lib/intelligence/voice/voice-intent-service.ts` rules where possible; do not let an LLM decide whether confirmation is required.

- [ ] **Step 4: Integrate one module at a time**

Order: Messaging -> Transport -> Care -> Jobs. Each integration replaces only the text-entry surface; existing submit/service logic remains authoritative.

- [ ] **Step 5: After each module, run its targeted tests plus communication tests**

Run: `pnpm vitest run tests/communication` plus the module's existing test directory.

- [ ] **Step 6: Commit each module integration separately**

Example:

```bash
git commit -m "feat(transport): add accessible communication input"
```

Do not combine all module adapters into one commit.

---

### Task 13: Preserve mobile/PWA/AAC support and offline safety boundaries

**Files:**
- Modify: `mobile-contracts/schemas/mobile-communication.ts`
- Modify: `lib/platform/offline/logout-cleanup.ts`
- Modify: `docs/careos/mobile-communication.md`
- Extend: `tests/accessibility/mobile-communication/`

**Interfaces:**
- Mobile clients receive preferences and saved phrases only where current consent allows.
- Raw speech/audio is never placed in the generic offline action queue.

- [ ] **Step 1: Write failing offline-boundary tests**

Assert `speech_audio`, raw transcript and model artefact payload classes are rejected from generic offline persistence.

- [ ] **Step 2: Implement mobile contract fields**

Add communication mode capability flags and Labs speech availability state, but do not duplicate speech models into mobile contracts.

- [ ] **Step 3: Verify logout cleanup**

Ensure any temporary local recording/blob URL and transcript draft is destroyed on safe logout/session reset.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/accessibility/mobile-communication tests/communication
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile-contracts lib/platform/offline docs/careos tests/accessibility/mobile-communication
git commit -m "feat(mobile): extend governed communication contracts"
```

---

### Task 14: Implement Essential Eight engineering evidence and security gates

**Files:**
- Create: `docs/security/essential-eight-communication-mapping.md`
- Create: `security/communication-security-controls.json`
- Create: `.github/workflows/communication-security.yml`
- Create: `tests/security/communication-security-controls.test.ts`
- Modify: `.github/workflows/security.yml` only where reusable checks can be shared without weakening existing gates.

**Interfaces:**
- Produces auditable control/evidence mapping; does not self-certify compliance.

- [ ] **Step 1: Write failing control-completeness test**

Require all eight ASD strategies in `security/communication-security-controls.json` with fields `owner`, `scope`, `evidence`, `targetMaturity`, `status`.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/security/communication-security-controls.test.ts`

- [ ] **Step 3: Add the eight-strategy control register**

Set target maturity `2` for each strategy. Mark organisational endpoint controls as `external_evidence_required` rather than falsely marking them implemented by application code.

- [ ] **Step 4: Add Communication Security CI**

The workflow must run: frozen install, dependency audit, CodeQL/available SAST hooks, secret scanning where supported, communication-specific unit tests, IaC tests, residency tests and SBOM generation. It must not bypass the existing repository security workflow.

- [ ] **Step 5: Add privileged-operation tests**

Test that model activation, dataset export, destructive deletion overrides and administrative speech-sample playback require privileged authorization and audit events.

- [ ] **Step 6: Run security suite and commit**

```bash
pnpm vitest run tests/security tests/labs/communication-residency.test.ts
pnpm audit --prod
git add docs/security security .github/workflows tests/security
git commit -m "feat(security): add Communication Platform Essential Eight evidence gates"
```

---

### Task 15: Add privacy lifecycle, export, withdrawal and deletion tests

**Files:**
- Create: `apps/labs-communication-service/src/domain/deletion.ts`
- Create: `apps/labs-communication-service/src/domain/export.ts`
- Create: `tests/privacy/communication-lifecycle.test.ts`
- Create: `docs/privacy/communication-platform-pia-inputs.md`

**Interfaces:**
- Produces participant export package manifest and deletion/withdrawal workflow.

- [ ] **Step 1: Write failing lifecycle tests**

Cover: participant export contains consent history and sample metadata but not internal security secrets; withdrawal blocks new training; deletion removes live audio and personal model artefacts; backup retention is reported transparently; research consent can be withdrawn independently of transcription consent.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/privacy/communication-lifecycle.test.ts`

- [ ] **Step 3: Implement export/deletion services**

All destructive actions are idempotent, audited and scoped to one opaque participant ref.

- [ ] **Step 4: Document PIA inputs**

Include data inventory, purposes, Australian-region diagram, vendors/subprocessors, retention, access roles, breach impact, consent/withdrawal and accessibility implications. Treat legal conclusions as requiring review.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/privacy/communication-lifecycle.test.ts
git add apps/labs-communication-service tests/privacy docs/privacy
git commit -m "feat(privacy): add communication data lifecycle controls"
```

---

### Task 16: Add backup/restore and Australian DR verification

**Files:**
- Modify: `infra/modules/backups/` only as required after inspection.
- Create: `scripts/verify-communication-residency.ts`
- Create: `scripts/verify-communication-restore.ts`
- Create: `tests/infra/communication-dr.test.ts`
- Create: `docs/disaster-recovery/communication-platform.md`

**Interfaces:**
- Verifies region metadata for storage/database/backups/logging/KMS.

- [ ] **Step 1: Write failing DR tests**

Assert primary is `ap-southeast-2`, DR is `ap-southeast-4`, no backup vault/replica target leaves Australia, and restore evidence requires a completed timestamp plus checksum/count comparison.

- [ ] **Step 2: Implement verification scripts**

Scripts operate read-only by default. Any actual restore is an operator-approved procedure and must restore into an isolated Australian test environment.

- [ ] **Step 3: Run static DR tests**

Run: `pnpm vitest run tests/infra/communication-dr.test.ts`

- [ ] **Step 4: Perform a restore rehearsal only after infrastructure exists and explicit approval is given**

Record RPO/RTO evidence and destroy the isolated test restore after verification.

- [ ] **Step 5: Commit static controls**

```bash
git add infra scripts tests/infra docs/disaster-recovery
git commit -m "feat(resilience): govern Australian communication DR"
```

---

### Task 17: Build the Labs pilot and co-design evaluation gate

**Files:**
- Create: `app/labs/communication/pilot/page.tsx`
- Create: `components/labs/communication/PilotConsentSummary.tsx`
- Create: `lib/labs/communication/pilot-eligibility.ts`
- Create: `tests/labs/communication-pilot.test.ts`
- Create: `tests/accessibility/communication-pilot.spec.ts`
- Create: `docs/labs/communication-pilot-checklist.md`

**Interfaces:**
- `evaluateCommunicationPilotEligibility(evidence)` returns explicit blockers; it never auto-enrols a participant.

- [ ] **Step 1: Write failing pilot-gate test**

The pilot must remain blocked unless evidence includes: AU residency verified, PIA approved, security review approved, Essential Eight ML2 assessment evidence recorded, penetration test acceptable, restore rehearsal complete, accessibility tests pass, consent text approved, human fallback available, personalised-speech model quality threshold approved when that mode is enabled.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/labs/communication-pilot.test.ts`

- [ ] **Step 3: Implement deterministic eligibility function**

Return `{ eligible: false, blockers: string[] }` until every required evidence item is true. Never read a marketing/status string as proof.

- [ ] **Step 4: Implement accessible pilot UI**

The page states experimental status, data location, what is collected, what is optional, withdrawal path, communication alternatives and how to request human help. Participation is opt-in.

- [ ] **Step 5: Run accessibility and pilot tests**

```bash
pnpm vitest run tests/labs/communication-pilot.test.ts
pnpm playwright test tests/accessibility/communication-pilot.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/labs/communication components/labs/communication lib/labs/communication tests/labs tests/accessibility docs/labs
git commit -m "feat(labs): add governed communication pilot gate"
```

---

### Task 18: Final programme verification and review pack

**Files:**
- Create: `docs/labs/communication-verification-pack.md`
- Update only documentation that is demonstrably supported by test/deployment evidence.

**Interfaces:**
- Produces merge/pilot readiness evidence; changes no runtime behaviour.

- [ ] **Step 1: Run repository verification**

```bash
pnpm install --frozen-lockfile
pnpm prisma validate
pnpm prisma generate
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

- [ ] **Step 2: Run focused suites**

```bash
pnpm vitest run tests/communication tests/communication-workforce tests/labs tests/access-infrastructure tests/security tests/privacy tests/infra
pnpm playwright test tests/accessibility/labs-communication.spec.ts tests/accessibility/communication-pilot.spec.ts
```

- [ ] **Step 3: Run security verification**

Run the existing Security, CodeQL/Semgrep and new Communication Security workflows. Do not allowlist a new critical/high advisory solely to make the branch green.

- [ ] **Step 4: Record evidence states**

For each item mark exactly one of: `verified`, `implemented_not_deployed`, `blocked`, `not_applicable`. Include commit SHA, workflow run URL/ID and date.

- [ ] **Step 5: Independent reviews**

Require security review, accessibility review, privacy review and participant/co-design review before a persistent-data Labs pilot. If Cursor BugBot and CodeRabbit are part of the branch policy, include actual inspection evidence; a skipped draft review is not evidence.

- [ ] **Step 6: Confirm prohibited claims**

The verification pack must state that MapAble is not claiming a Google partnership, Project Euphonia support, clinical validation, Essential Eight certification or production-ready personalised speech unless separate authoritative evidence exists.

- [ ] **Step 7: Commit**

```bash
git add docs/labs/communication-verification-pack.md
git commit -m "docs(communication): add integration verification pack"
```

---

## Merge and rollout order

1. Merge PR 1 only after canonical communication tests are green.
2. Merge PR 2 only after IaC/static security/residency tests are green; do not deploy automatically.
3. Deploy staging AU enclave only with explicit approval; verify actual region/KMS/storage/logging evidence.
4. Merge PR 3 and run capture with synthetic/non-personal test audio first.
5. Merge PR 4 with personalised engine disabled; training remains research-gated.
6. Merge PR 5 module adapters one by one, preserving each module's existing business logic.
7. Merge PR 6 only after privacy/security review; perform controlled backup restore and penetration testing separately.
8. Merge PR 7 to expose the pilot gate; the gate remains blocked until evidence is complete.
9. Enable Labs pilot for a small consented co-design cohort only after explicit approval.
10. Promotion out of Labs is a separate product/security decision and is not part of this plan.

## Critical blockers that must be resolved before persistent participant speech

- Verify the actual residency of any existing MapAble database fields used by Communication Passport/AccessibilityProfile; if they are not Australian-resident, do not persist Labs participant communication content there.
- Verify cloud/subprocessor arrangements and prevent participant content from entering non-Australian telemetry/support systems.
- Complete a Privacy Impact Assessment.
- Establish an organisational Essential Eight evidence owner for controls that live outside application code, especially endpoint application control, Office macros, user-application hardening, operating-system patching and administrator MFA.
- Define speech data retention periods and backup-deletion semantics before collection.
- Approve model evaluation criteria before enabling personalised recognition.

## Definition of done for full Labs integration

The programme is complete when a participant can enter `labs.mapable.com.au/communication`, use text/AAC/speech according to their preferences, review and correct recognition output, optionally contribute consented speech samples, see/withdraw their consent, use confirmed communication input in Access/NPTM and selected MapAble modules, and request human help — while sensitive communication content remains in Australian regions, security/privacy evidence is auditable, and no experimental model can trigger consequential actions without participant confirmation.
