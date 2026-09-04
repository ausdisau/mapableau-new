# Guardian — Threat Model (stub)

**Status:** `DOCUMENTED_INTENT` / `DESIGNED_CONTROL`  
Full STRIDE/OWASP analysis required before production.

## In-scope threats (minimum)

- BOLA / IDOR; broken function-level authorisation
- Mass assignment / property injection (`useCloudModel` bypass)
- Prompt injection / indirect prompt injection
- Cross-tenant leakage; consent replay; stale/revoked authority
- Processor policy bypass; local-to-cloud failover bypass
- SSRF via model endpoints; model response injection
- Sensitive logging / secret leakage; audit tampering
- Excessive model resource consumption; malformed structured output
- Privilege escalation via human review queues

## Mitigations in Phase 0–2

- Fail-closed flags
- Server-side actor/tenant/authority resolution on evaluate API
- Ignore/reject cloud bypass hints
- No silent private→external failover
- Audit metadata redaction via existing `createAuditEvent`
- Never send secrets/tokens/keys to general-purpose models (policy)

## Open

- Independent security review
- Adversarial eval harness (Phase 9)
