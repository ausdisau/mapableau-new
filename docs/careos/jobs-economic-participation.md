# CareOS Phase 10 — Jobs and Economic Participation

Phase 10 adds participant-controlled employment profiles, transparent job match explanations, employer accessibility evidence (separate from marketing claims), and disclosure-gated applications. Existing ATS flows under `app/employer/` and `app/employment/` are reused — this phase does not duplicate employer pipelines.

## Fairness boundaries (hard)

CareOS **must NOT**:

- Compute employability scores
- Reject applicants automatically
- Infer capability from disability
- Rank candidates by productivity
- Share disability or adjustment information without participant consent

These are enforced in `lib/jobs/fairness-boundaries.ts` and hardcoded off in `lib/config/jobs-participation.ts`.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_JOBS_PARTICIPATION_ENABLED` | `false` | Master switch for participant jobs participation |
| `MAPABLE_JOBS_MATCHING_EXPLANATIONS_ENABLED` | `false` | Transparent requirement/adjustment explanations |
| `employabilityScoringEnabled` | **hardcoded `false`** | No employability scoring |
| `automaticApplicantRejectionEnabled` | **hardcoded `false`** | No automatic rejection |
| `disabilityInferenceEnabled` | **hardcoded `false`** | No disability-based capability inference |
| `productivityRankingEnabled` | **hardcoded `false`** | No productivity ranking |

## Schema (migration `20260714110000_jobs_participation`)

New models:

- `EmploymentProfile` — skills, interests, work preferences, communication/adjustment/disclosure choices
- `EmploymentGoal` — participant employment goals (not scores)
- `EmployerAccessibilityEvidence` — verified evidence vs `EmployerAccessibilityCommitment` claims
- `WorkplaceLocation` — employer workplace sites
- `WorkplaceAccessibilityEvidence` — location-specific accessibility evidence
- `JobRequirement` — structured job requirements for explanation matching
- `JobMatchExplanation` — transparent matched/not-matched/unknown breakdown
- `ApplicationDisclosurePreview` — participant preview of employer-visible fields

`Job.workplaceLocationId` links jobs to workplace locations.

## Module layout

```
lib/jobs/
  fairness-boundaries.ts
  participants/employment-profile-service.ts
  goals/employment-goals-service.ts
  matching/match-explanation-service.ts
  applications/participant-application-service.ts
  disclosure/disclosure-preview-service.ts
  evidence/employer-evidence-service.ts
lib/config/jobs-participation.ts
app/participant/jobs/          — participant hub
components/jobs/               — accessible panels
app/api/participant/jobs/      — participant APIs
```

## Key APIs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET/PATCH | `/api/participant/jobs/profile` | Employment profile |
| GET/POST/PATCH | `/api/participant/jobs/goals` | Employment goals |
| GET | `/api/participant/jobs/matches` | List match explanations |
| GET/POST | `/api/participant/jobs/matches/[jobId]` | View/generate explanation |
| GET/POST | `/api/participant/jobs/applications` | List/create applications |
| GET/PATCH/POST | `/api/participant/jobs/applications/[applicationId]` | View/correct/submit/request adjustment |
| GET/PATCH/POST | `/api/participant/jobs/applications/[applicationId]/disclosure-preview` | Disclosure preview |
| POST | `/api/participant/jobs/applications/[applicationId]/withdraw` | Withdraw application |

`GET /api/jobs/[jobId]` includes requirements and accessibility evidence when participation is enabled.

## Employment entry points and the skills-first pilot

The public address is `/jobs`, which redirects to `/employment`. The Jobs guide is a first-party static publication at `/employment/guide/index.html`. Its role filters and interview message planner work in the browser. MapAble’s existing authenticated services own employer drafts and applications. The same guide is packaged for Sites. The native Independence Suite opens `/jobs` from **More → MapAble Employment** and offers a session-only application checklist.

| Journey | Implemented in this change | Boundary |
| --- | --- | --- |
| Explore roles | Browse three labelled fictional briefs by skill and work setting. Open the signed-in pilot or find employment support. | An outlet in Provider Finder is a support service. A vacancy must come from the Jobs publication workflow. |
| Prepare an interview | Select questions in advance, written or AAC responses, extra time or step-free access. Edit, copy or clear the draft. | The planner sends nothing. The job seeker chooses a recipient and can share their own wording. |
| Describe a role | An employer selects an active organisation they manage and lists essential and additional skills. They can specify ways to demonstrate the work. | When the Jobs participation flag is enabled, the existing `JobRequirement` records, job draft and audit event are written together. Earlier listings still open. An administrator reviews a draft before publication. |
| Read a role | The employer, administrator and signed-in candidate see the same skills and employer-supplied instructions. | An exact self-listed skill can explain a match. An interest or a similar word does not establish a skill, qualification or screening clearance. The candidate keeps the choice to apply. |

### Delivery after the role-brief pilot

| Next outcome | Owner and dependency | Evidence before release |
| --- | --- | --- |
| An applicant can share a written example or a link they choose, see exactly what the employer receives, and withdraw. | Jobs and participant co-design leads. Reconcile the dashboard application form with the existing participant disclosure-preview service. | Test with a candidate using AAC and a keyboard-only candidate. Confirm field-level withdrawal, retry behaviour and a human contact for corrections. |
| A candidate can agree an interview format and plan travel. | Employer operations, Access and Transport. Record specific workplace features, their source and date, and who will confirm an adjustment. | Separate an employer’s offer from a verified feature. Verify a private, revocable handoff for one recipient and stage. Check that a missing transport or access record leaves the role available. |
| Employers can improve hiring practice and participants can choose follow-up support. | Employment operations and participant reviewers. Offer a human review for disputed information and opt-in placement follow-up. | Measure adjustment fulfilment and the time to an employer response. Review small cohorts privately. JobAccess and Inclusive Employment Australia are external support pathways. |

LinkedIn’s skills-first hiring guidance informs the distinction between day-one and additional skills. LinkedIn’s School of SRE gives an example of organising learning around the tasks of a particular role. LiFT gives the evaluation team a reference for comparing outcomes across groups. A suitable first check uses paired synthetic profiles with identical skills and different communication preferences. Neither a LinkedIn account nor an external profile is required. [Hiring guidance](https://business.linkedin.com/hire/resources/talent-acquisition/adopting-skills-based-hiring) · [School of SRE](https://github.com/linkedin/school-of-sre) · [LinkedIn Fairness Toolkit](https://github.com/linkedin/LiFT)

Any later sending of jobs to LinkedIn or receiving applications through Apply Connect needs LinkedIn approval and an agreement covering the data flow. The pilot has no LinkedIn API dependency. [Job Posting API](https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/overview) · [Apply Connect](https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/apply-connect-overview)

Keep the Jobs flag off outside the agreed pilot. Before wider release, run the employer-to-candidate journey against a staging database and test keyboard, switch, AAC, screen-reader and narrow-screen use with participants. Disabling the flag removes structured authoring and display. The public examples and planner remain usable. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [JobAccess](https://www.dss.gov.au/disability-employment-support-programs/jobaccess) · [Inclusive Employment Australia](https://www.servicesaustralia.gov.au/inclusive-employment-australia)

## Participant application flow

1. Build or update employment profile and goals.
2. Optionally generate a match explanation (no ranking).
3. Create a draft application (reuses `lib/jobs/job-service.ts`).
4. Preview disclosure — confirm what the employer will see.
5. Submit application (blocked until disclosure preview is confirmed).
6. Withdraw, correct, or request interview adjustments at any time before final employer decision.

## Validation

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/mapable
export DIRECT_URL=postgresql://user:password@localhost:5432/mapable
pnpm prisma validate && pnpm prisma generate
pnpm vitest run tests/jobs
```
