# Standing-instruction envelope — Stage 1 design note

**Status:** design only — **no product store** until Stage 3  
**Ceiling:** first executable SI is L2 pre-authorised, reversible, after Stage 1 trust evidence

## Required manifest fields

| Field | Rule |
|-------|------|
| actor identity | Server-verified only |
| participant + tenant | Participant-canonical; PEP + tenant guard |
| allowed tool/action | Explicit allowlist; no wild expansion |
| purpose + data fields | Exact-purpose consent revision must match |
| cost / contact limits | Hard ceilings; family exclusions enforceable |
| schedule window | Expiry required; no blanket future consent |
| geo / device boundaries | Optional; deny outside |
| grant + consent revision | Recheck before every tool call and retry |
| retries | Bounded; idempotency key required |
| reversibility | Cancel / compensating action where feasible |
| audit correlation | Immutable decision + operation IDs |
| fallback / escalation | Named human pathway; silence ≠ consent |

## Non-goals (Stage 1–2)

- Persisting SI rows in Prisma
- Auto-execute without participant standing approval UX
- L3+ unsupervised service coordination
- Model-written grants or self-expanding privileges
