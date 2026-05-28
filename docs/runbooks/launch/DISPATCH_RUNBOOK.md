# DISPATCH_RUNBOOK

## Owner
ops

## Summary
Dispatch runbook documented.

## Acceptance criteria
- [ ] Definition of done is testable and signed off by owner role
- [ ] Evidence attached in admin launch readiness (document ID, ticket, or screenshot link in notes)
- [ ] Admin dispatch console shows care allocation and transport review queues after sync
- [ ] Care allocation approve/reject flow verified with `CARE_ALLOCATION_AUTONOMY_TIER=recommend_only`
- [ ] Transport dispatch board confirms manual assign only (no auto-assign from optimisation)

## Evidence required
- Link or document ID recorded on the checklist row in `/admin/launch-readiness`
- Related platform gap `launch.DISPATCH_RUNBOOK` shows met when status is ready or waived

## Related links
- [Launch checklist](/admin/launch-readiness)
- [Platform gaps](/admin/platform-gaps)
- [Full public launch guide](/docs/full-public-launch.md)

## Waive policy
- Waive only with written rationale in notes and explicit product/legal approval for critical items
- Governance items (`PUBLIC_LAUNCH_GO_NO_GO`, `PUBLIC_BETA_EXIT_REVIEW`) must not be waived without council sign-off
