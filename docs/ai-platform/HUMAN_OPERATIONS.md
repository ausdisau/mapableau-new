# Human Operations + Escalation Console (Prompt 08)

Human control plane for MapAble's Agentic Nerve Centre. Authorised operators
resolve cases needing human judgement **without bypassing participant authority**.

```
Mission Runtime / Recovery / Action Kernel / Matching / Safeguarding / Continuity
        │
        ▼
 HUMAN REVIEW QUEUE  (canonical HumanOpsReviewItem)
        │
        ▼
 Operator Console — review, request info, explain, coordinate, record decision
        │
        ▼
 Governed workflow (Action Kernel / Recovery prepare — never silent execute)
```

## Canonical location

| Concern | Path |
|---------|------|
| Types / queue / RBAC / lifecycle | `lib/ai/platform/human-operations/` |
| Shared category taxonomy | `lib/ai/platform/human-review/contracts.ts` |
| Feature flag | `lib/config/human-operations.ts` |
| Operator Console | `/admin/ai/human-ops` |
| APIs | `/api/ai/human-ops/*` |

Do **not** create a parallel review system. Queue items extend
`MapAbleHumanReviewItem` / human-review contracts.

## Categories

`care_coordination`, `transport_continuity`, `access_evidence`,
`authority_review`, `financial_review`, `credential_exception`,
`employment_disclosure_review`, `safeguarding`, `general_coordination`

**Safeguarding remains human-only.**

## Access control

- Uses existing RBAC permissions and tenant (organisation) memberships.
- Human Ops RBAC **does not** use `hasPermission()`'s admin universal bypass.
- Operators must hold category permissions **explicitly** on their role list.
- Empty tenant membership ⇒ empty queue (fail closed).
- Minimum necessary information on participant surfaces.

## Operator authority

Human review ≠ unrestricted authority. Resolutions record:

- who decided
- under what authority
- which evidence refs were used
- that participant approval was **not** bypassed (`participantApprovalBypassed: false`)

Prepared next steps (Action Kernel proposal ids / recovery alternatives) are
**not executed** by the console.

## Safeguarding boundary

AI may organise factual records. AI / console **must not** determine:

- substantiation / dismissal
- reportability
- sanction
- restrictive-practice approval
- incident closure

Model-generated final safeguarding decisions are rejected
(`MODEL_SAFEGUARDING_DECISION_FORBIDDEN`).

## Participant visibility

Where appropriate, participants see: why review is needed, status, handling team,
what information is used (redacted for safeguarding), and what happens next —
without protected internal investigative notes.

## Persistence

In-memory store (matches Prompt 01–03). Durable model → **Prompt 08A** (stop
condition if migration required).

## Feature flag

`MAPABLE_HUMAN_OPERATIONS_CONSOLE_ENABLED=false` (fail closed).

## APIs (auth-gated)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ai/human-ops/queue` | Role+tenant filtered queue |
| GET | `/api/ai/human-ops/reviews/:id` | Operator or participant view |
| PATCH | `/api/ai/human-ops/reviews/:id` | Non-terminal metadata |
| POST | `.../assign` | Assign operator |
| POST | `.../request-info` | Request participant information |
| POST | `.../resolve` | Record resolution (no execute) |

## Accessibility

Operator Console targets WCAG 2.2 AA: labelled controls, table caption,
`role="alert"` / `aria-live`, skip link, keyboard workflow hints
(`HUMAN_OPS_A11Y`).

## Authority changes

**None.** No expansion of AI or operator authority beyond existing role permissions.
