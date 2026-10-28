# MapAble ACSS — AGI / Capability-Readiness

**Phase:** 0 — Forensic audit  
**Invariant:** Increasing AI capability must not automatically increase AI authority.

---

## 1. Control plane vs intelligence plane

```text
MODEL (capability ↑ over time)
   ↓
REASONING / SPECIALISTS
   ↓
AGENT (bounded manifest)
   ↓
TOOLS (allowlisted)
   ↓
GOVERNANCE (consent ∩ privacy ∩ rights ∩ risk ∩ policy)
   ↓
HUMAN APPROVAL (when required)
   ↓
DETERMINISTIC ACTION GATEWAY
```

| Plane | May evolve quickly | Must remain stable |
|-------|--------------------|--------------------|
| Models / prompts / reasoning quality | Yes | — |
| Tool implementations | Yes (versioned) | Allowlists + authz |
| Agent skill | Yes | `authorityCeiling`, prohibitedActions |
| Consent / policy / rights / risk / audit | — | **Independent of model** |
| Human agency & refusal | — | **Non-negotiable** |

MapAble already encodes this in Agentic Nerve Centre doctrine and `AuthorityCeiling` + `PROHIBITED_AUTONOMOUS_ACTIONS` (`lib/ai/platform/types/authority.ts`).

---

## 2. What changes when a much more capable model arrives?

| Change | Allowed? |
|--------|----------|
| Better summaries, plans, gap detection | Yes |
| Richer mission decomposition | Yes |
| Higher-quality drafts for human approval | Yes |
| Lower latency / cost via router | Yes (gateway) |
| Automatically raising autonomy ceilings | **No** |
| Skipping consent because “model is sure” | **No** |
| Treating inference as legal/NDIS determination | **No** |
| Self-modifying policies/prompts/tools/authority | **No** (prohibited) |
| Retaining hidden long-term memory | **No** (prohibited) |
| Executing instructions from retrieved documents | **No** (prohibited) |

---

## 3. What must NOT change

```text
CONSENT
POLICY
RIGHTS
RISK
AUDIT
HUMAN AGENCY
TENANT ISOLATION
FAIL-CLOSED DEFAULTS
```

Enforcement must remain **infrastructural** (guardian, action policy, RBAC, kill switches), not prompt text alone.

---

## 4. Repository readiness for capability growth

| Mechanism | Status | AGI relevance |
|-----------|--------|---------------|
| Capability registry + flags | EXISTS | Gate new model-backed skills |
| Kill switches | EXISTS | Instant global/capability halt |
| Authority ceilings | EXISTS | Cap autonomy regardless of IQ |
| Guardian processing zones | EXISTS (flags off) | Keep sensitive data off weak boundaries |
| Action kernel approvals | EXISTS (in-memory) | Human in the loop for side effects |
| Prompt governance registry | EXISTS | Versioned prompts |
| Evaluation suites | PARTIAL | Must grow with model upgrades |
| Durable governance decisions | PARTIAL | Required for accountability at scale |

---

## 5. Evaluation requirement

Before raising any model’s production exposure:

1. Run capability eval suite (`lib/ai/platform/evaluations/`, `tests/ai-platform/`).  
2. Re-run adversarial suite (consent bypass, tool abuse, cross-participant).  
3. Confirm authority ceilings unchanged.  
4. Confirm public claims remain honest (`production-claims` CI).  

A better model that fails governance tests **does not ship**.

---

## 6. NDIS / disability-domain note

Higher capability increases risk of authoritative-sounding incorrect advice. Policy Intelligence outputs must retain:

```text
FACT → INTERPRETATION → INFERENCE → RECOMMENDATION
```

Never present AI interpretation as official NDIA/government determination. This constraint tightens—not loosens—as models improve.

---

## 7. Accessibility note

More fluent agents must not reduce understandability. Approval UX and Navigator language remain plain-language, screen-reader safe, and refusals must be easy.

---

## 8. Summary

MapAble’s architecture is **directionally AGI-ready** if ACSS continues to separate intelligence from authority and completes durable governance/action persistence. The platform’s existing prohibitions and ceilings are the correct invariant spine; ACSS work should harden them, not replace them with model judgment.
