# Access Intelligence expansion — quality gates

Pilot gate checklist applied at the end of Waves 0–5.

| Gate | Rule |
|------|------|
| Canonical place binding | Living Twin / visit plans / evidence keyed by `AccessPlace` |
| Live adapters off | BMS / messaging default disabled |
| Unknown ≠ absent | Expired evidence treated as unknown |
| Regression pack | Release evidence pack generated for the wave |
| Journey approvals | Recovery proposals hashed + approval-gated |
| Guide fact binding | No unbound or legal-compliance sentences |
| Mapper confidence invariant | Points/badges never enter confidence |
| Widget list alternative | Mandatory accessible list for embeds |
| Regional small-cell | Aggregation thresholds / suppression |
| No paid plan bias | Plans never alter scores/confidence |
| Playwright smoke | Hub + Verify redirect + key consoles reachable |

Implemented in `lib/access-intelligence/quality-gates.ts` and
`tests/access-intelligence/quality-gates.test.ts`.
