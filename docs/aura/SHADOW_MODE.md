# AURA Wave 3 — Shadow Mode

Shadow evaluation runs pure preflight validators and policy stages only. It never calls create/send/publish/book/notify adapters. Invariants: `executionAttempted: false`, `externalSideEffects: 0`. Unknown required adapter state cannot yield `would_allow`.
