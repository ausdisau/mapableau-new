# Threat model and known limitations (v0.1.0)

| Threat / failure mode | Adversarial or accidental pathway | Local mitigation | Host-system work required |
| --- | --- | --- | --- |
| Forged consent | Client claims an unverified grant | Purpose, recipient, subject and time checks | Server-side authentication, signed/authoritative grants, revocation propagation |
| Stale capability claims | Provider appears suitable after evidence expiry | Explicit expiry plus verified-only gates | Independent verification, credentials and real-time updates |
| Discriminatory matching | 'Cheap' substitutes for communication or access fit | Hard capability/communication exclusions | Co-design, lawful fairness evaluation, no prohibited proxies |
| Travel harm | Shortest route includes stairs or unverified path | Fail-closed segment criteria | Lift/closure feeds, location proof, in-trip updates, emergency alternative |
| Double booking | Two simultaneous slots share a worker/vehicle | Resource-token conflict check | Transactional locking, work limits, actual resource IDs and buffers |
| Privacy leakage | Sparse locality/service cohort reveals a participant | Minimum cell suppression, null for hidden values | Contextual privacy risk assessment, disclosure-control review, secure aggregate publication |
| False affordability | Budget ceiling is treated as a reduction in human need | Required units are invariant by policy scenario | Current lawful funding rules, human planner, participant review |
| Political influence | Party metadata changes economic results | Counterfactual label-invariance test | Independent audit of data, constraints, interpretations and distributional effects |
| Unfair capacity allocation | Greedy scheduling disadvantages groups or shifts costs | Advisory-only outputs and equity screen | Fair scheduling objective, labour/industrial safeguards, impact evaluation |
| Excessive trust in verification | Caller fabricates `verified` record | No auto-upgrade of unknown evidence | Source authentication, assessor calibration and tamper-evident records |
| False audit security | Audit payload mistaken for immutable ledger | Explicit documentation | Append-only secured event store, signing, retention and oversight |
| Model misuse | API consumer ignores advisory flags | Response shape requires review markers | Server-side rule enforcement, approval gates and revocation |
| Unpaid care shifting | Savings calculated without family burden | Fiscal model does not propose support reductions | Economic model should include spillover costs and lived-experience outcomes |

## Out of scope

The package does not implement network access, OAuth, tenancy, PII encryption,
secure data ingestion, production credential checks, NDIS claim validation,
clinical escalation or automatic reservations. None of these protections can
be inferred simply from the existence of pure functions.

## Red-team priorities

Test malicious data records (invalid timestamps, absent evidence, massive counts,
negative costs, duplicate IDs), missing consent, forged provider verification,
rare population disclosure, unexpected participant refusal, unavailable worker,
unreliable AAC, inaccurate transport accessibility information, conflicting
worker/vehicle reservations, database race conditions and funding shocks.
