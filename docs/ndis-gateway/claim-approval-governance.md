# Claim approval governance

## Rules

1. Approval references one exact `NdisClaimSnapshot`
2. Organisation on approval must match snapshot organisation
3. `payloadHash` must match the snapshot hash
4. Expired, revoked, rejected approvals cannot authorise submission
5. Superseded snapshots cannot be approved or submitted
6. Global pilot approval (`NdiaPilotApprovalRecord`) is never claim authority
7. Only NDIA-managed + registered provider may receive direct-submission approval
8. Creator and approver should be different users for live claims
9. No AI system may autonomously approve or submit claims

## Break-glass

Permission `admin:ndis:claim:break_glass` is reserved for audited elevated access.
Break-glass must record reason, actor, organisation, and snapshot ID.
