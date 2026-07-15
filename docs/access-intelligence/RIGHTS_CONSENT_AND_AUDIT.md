# Rights, consent, and audit

`evaluateActionPolicy` / `executeApprovedSensitiveAction` in `lib/access-intelligence/rights/action-policy.ts`.

Sensitive actions need explicit approval. Only shareable fields permitted. Revoked consent rejected. Audit stores purpose, recipient, fields, payload hash — not health notes or chat transcripts.
