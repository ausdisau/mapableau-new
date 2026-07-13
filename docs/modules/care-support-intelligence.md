# Care & Support Intelligence research lab

MapAble CSI is a participant-controlled research system for linked care and
accessible-transport coordination. It is not a claim of human-level AGI and it
does not have authority to act in the world.

## Current research capability

The lab builds a synthetic participant world state from explicit goals,
preferences, consent, a time-limited mandate, situational safeguard context and
reviewable episodic events. Five deterministic specialist roles then contribute
evidence-backed observations:

1. **Rights** checks participant authority and the confirmation boundary.
2. **Continuity** identifies plans that preserve familiar support.
3. **Accessibility** treats explicit access features as hard constraints.
4. **Journey** compares complete Care + Transport goal consequences.
5. **Budget** checks combined price changes against the delegated limit.

The counterfactual simulator assembles complete recovery plans, estimates their
time, price, access and continuity consequences, and ranks them with a published
deterministic formula. Specialist disagreement is surfaced to the participant;
it is never resolved by silently overriding their preferences.

## CSI-AGI kernel

The research brain now runs inside a typed kernel control plane. “AGI” names the
long-term research architecture; it is not a claim that the system has general
human intelligence, consciousness or unrestricted autonomy.

Each kernel run performs one bounded cognitive cycle:

1. **Boot** validates the synthetic boundary and capability registry.
2. **Perceive** admits only authorised, firewall-filtered evidence.
3. **Orient** orders explicit participant goals and checks current authority.
4. **Deliberate** consults bounded specialist functions.
5. **Simulate** compares complete counterfactual consequences.
6. **Arbitrate** applies the separate, deterministic policy engine.
7. **Commit** may prepare expiring non-executable commitments.
8. **Complete or halt** verifies invariants and the audit chain.

The capability registry contains eight participant-scoped functions in the
`read`, `reason`, `simulate`, `prepare` and `audit` classes. Registration fails
if a capability has side effects, external network access, persistent writes or
an execution-oriented identifier.

Kernel state contains explicit goals, evidence-backed beliefs, bounded
commitments, metacognitive uncertainty, capability invocations and audit events.
It does not store private chain-of-thought. Explanations are concise stage
summaries with resolvable evidence references.

Nine invariants are checked on every cycle:

- synthetic data only;
- participant stop dominates every goal;
- no execution capability;
- no external-model capability;
- no persistent memory;
- policy remains separate from specialists;
- bounded cycle count;
- bounded commitment count;
- every evidence reference resolves.

Audit events form an in-memory SHA-256 hash chain. Replay verifies sequence,
previous-hash linkage and event content. A changed audit summary invalidates the
chain. This supplies tamper evidence for research; it is not yet a production
immutable audit store.

## Authority architecture

```text
Synthetic scenario
       |
       v
Participant world state ----> content firewall
       |                            |
       v                            v
Five read-only specialists -> counterfactual simulator
       |                            |
       +---------- evidence --------+
                    |
                    v
          locked policy engine
                    |
          +---------+----------+
          |                    |
     stop/escalate        non-executable intent
                               |
                         participant confirmation
                         (disabled in Gate 0)
```

Language models, if introduced in a later research gate, may translate a
participant request or explain a result. They must not become the policy engine,
source of truth, ranking authority or holder of a database/payment/messaging
credential.

## Non-negotiable Gate 0 boundary

- Synthetic scenario catalogue only; arbitrary prompts and participant IDs are
  rejected.
- No provider booking, calendar, message, payment or emergency-service port.
- No external model calls.
- No persistent memory writes.
- No self-modification or policy modification.
- No participant vulnerability or risk score.
- No clinical, funding or restrictive-practice decisions.
- Emergency requests are handed to the agreed human protocol.
- Every proposed intent requires participant confirmation and expires quickly.

The runtime refuses to start if an execution, messaging, external-model or
persistent-memory flag is enabled.

## Environment flags

```dotenv
MAPABLE_AUTONOMOUS_COORDINATION_ENABLED=true
MAPABLE_AUTONOMOUS_COORDINATION_SANDBOX=true
MAPABLE_AUTONOMOUS_COORDINATION_SYNTHETIC_ONLY=true
MAPABLE_AUTONOMOUS_COORDINATION_REAL_WORLD_EXECUTION=false
MAPABLE_AUTONOMOUS_COORDINATION_EXTERNAL_MESSAGING=false
MAPABLE_AUTONOMOUS_COORDINATION_EXTERNAL_MODELS=false
MAPABLE_AUTONOMOUS_COORDINATION_PERSISTENT_MEMORY=false
```

Only lowercase `true` enables a flag. Gate 0 requires the first three values to
be `true` and the remaining four to be `false`.

## Routes

- `/dashboard/intelligence` — participant-facing research cockpit.
- `GET /api/intelligence/csi/health` — public boundary health, no scenario data.
- `GET /api/intelligence/csi/scenarios` — authenticated fixed-scenario list.
- `POST /api/intelligence/csi/deliberate` — authenticated run by scenario ID.
- `GET /api/intelligence/csi/evaluation` — authenticated adversarial evaluation.
- `POST /api/intelligence/csi/kernel/run` — authenticated bounded kernel cycle.
- `GET /api/intelligence/csi/kernel/evaluation` — CSI and kernel invariant suite.

## Evaluation catalogue

The 18 scenarios cover stable monitoring, worker/vehicle/linked cancellation,
delay inside and outside authority, participant stop, revoked and expired
mandates, inaccessible vehicles, expired screening, high-criticality unfamiliar
support, prompt injection, combined price constraints, missing information,
clinical decisions, funding decisions and emergency handoff.

Every scenario checks:

- expected policy outcome;
- zero actions, messages, external models and memory writes;
- non-executable confirmation-gated intents;
- complete evidence-reference integrity;
- access, credential, time and combined-price constraints;
- participant stop and revocation controls;
- absence of person-level risk labels and untrusted provider instructions.

Dedicated kernel tests also cover unsafe capability rejection, participant-stop
halting, inactive-authority halting, bounded commitments, metacognition,
specialist/policy separation, deterministic replay and audit tampering.

## Next gated research steps

1. Add participant co-design tests for the explanations and trade-off display.
2. Add a read-only adapter over synthetic copies of BookingGraph and
   SupportJourneySession records.
3. Add temporal replay and chaos testing for concurrent cancellations.
4. Add fairness slices across language, AAC and access-requirement scenarios.
5. Independently review the policy rules, privacy boundary and accessibility.

Real-world reads, persistent memory, model assistance or execution each require
a separate safety case and release decision. They are not implied by this lab.

## Additional domain slices

- [Transport, Employment and Workday Intelligence](transport-employment-intelligence.md)
- [Foods, Rehabilitation and Daily Living Intelligence](foods-rehabilitation-intelligence.md)
