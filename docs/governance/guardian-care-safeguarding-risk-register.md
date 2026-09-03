# Guardian — Care & Safeguarding Risk Register

**Status:** `DOCUMENTED_INTENT`

| Risk ID | Description | Mitigation (current) | Residual | Owner needed |
|---------|-------------|----------------------|----------|--------------|
| GS-01 | Model treated as finding of abuse | Signals only `possible_*`; provenance `model_inference` | Medium until UI/ops trained | Safeguarding |
| GS-02 | Silent cloud processing of D3/D4 | Router fail-closed; flags off | Low while flags off | Privacy/Security |
| GS-03 | Reportability decided by AI | Safeguarding gate invariants + tests | Low | Safeguarding |
| GS-04 | Participant trapped in AI-only path | Manual incident/complaint remain; non-AI degradation | Medium until Phase 7 | Product/A11y |
| GS-05 | Over-censorship of disability language | Bias evals deferred Phase 9 | High until evals | Safeguarding/AI |
| GS-06 | Twin chat drafts diverge from SoR | Convergence doc; no new twin SoR | Medium | Platform |

Do not mark residual risks “accepted” without named owner sign-off.
