# Evaluation framework

Synthetic-only harness lands in the ai-evals PR. Dimensions include schema/citation validity, abstention, tool allowlist, prompt-injection resistance, tenant isolation, consent, accessibility, model outage fallback, budgets.

No bare aggregate “AI safety score”.

## Nerve Centre Eval Lab (Prompt 10)

End-to-end synthetic simulation over real Agentic Nerve Centre modules lives in
`lib/ai/platform/eval-lab/` — see [NERVE_CENTRE_EVAL_LAB.md](./NERVE_CENTRE_EVAL_LAB.md).

Extends this harness (does not replace it): hard safety invariants can fail CI;
soft quality / model rubrics cannot. Flag: `MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED=false`.
