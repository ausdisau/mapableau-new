# Portfolio KPIs

## Access intelligence
- % places with feature-level evidence
- Evidence freshness distribution
- Verified vs inferred observations
- Successful corrections
- False/inaccurate accessibility report rate
- Accessible-route completion

## Participant control
- Consent comprehension proxies
- Disclosure revocation success
- Participant override rate
- Recommendation accept/reject rate
- Unauthorised disclosure incidents — **target zero**

## Care / Transport
- Coordinated journey completion
- Vehicle mismatch rate
- Missed support rate
- Participant-requested change success

## Jobs
- Interview accessibility
- Placement rate
- Adjustment fulfilment
- Transport sustainability
- 13/26/52-week retention

## Trust
- Credential-expiry exceptions
- Incident response time
- Complaints resolution
- Disputed evidence corrections

## AI
- Task success
- Unsupported-claim rate
- Unsafe recommendation rate
- Escalation precision
- Tool misuse / forbidden action attempts
- Non-AI fallback success
- Accessibility parity
- Cohort disparity

## Mapping to existing harnesses
- Analytics/metric registry: `lib/platform/analytics/` (flag-gated)
- AI evals: `lib/ai/platform/evaluations/**`, `pnpm ai:evals`
- Transport honesty: `lib/transport/feature-status.ts`
- Public claims: ConvergenceOS public claim registry (all currently disallowed)
