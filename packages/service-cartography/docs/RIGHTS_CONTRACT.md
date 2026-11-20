# Rights contract (proposed)

**Scope**: Algorithm design and evaluation rules for MapAble Service Cartography.
This is a proposed software contract, not a legal determination or substitute
for professional advice.

## Non-tradable constraints

- Participant will, preferences and direct communication take precedence over
  inferred convenience or model-generated ideas of their 'best interests'.
- No matching or scheduling on personal service data without a valid,
  purpose-specific, recipient-scoped consent or other properly assessed legal basis.
- No recommendation of a provider who has been explicitly blocked by the
  participant, lacks verified capabilities, or cannot meet stated communication
  requirements.
- No automatic termination, reduction or reassignment of necessary support on
  the basis of price, funding availability, reliability prediction or disability.
- Unknown accessibility measurements are not assumed suitable.
- No protected-attribute inference from diagnoses, behaviour or location.
- No hidden affiliate preference or unreviewed provider incentive in ranking.
- No autonomous restrictive practice, medical intervention, worker exclusion,
  incident reportability determination, or eligibility decision.
- No assumption that a nominee, parent, carer, provider or sponsor can replace
  the participant's own choices. Delegation must be narrow, verified and revocable.

## Operational contract

1. The host application authenticates identity and organisation boundaries.
2. The host validates lawful consent/authorisation and its withdrawal semantics.
3. This library applies additional conservative input-level scope checks.
4. All model suggestions are `advisory_only`. That metadata lives on
   `MatchResult.advisory` at the result level, not on each `RankedOffer`.
5. Host applications render alternative options and comprehensible explanations.
6. Participants can refuse, contest and obtain an accessible human review.
7. Before any downstream service is performed, the host re-verifies capability,
   current credentials, scheduling, transport conditions and authorisation.
8. A secure append-only audit service stores metadata, not full unnecessary
   participant records; privacy and deletion policies are separately governed.

## Prohibited optimisation objectives

- Penalising people for complex support needs, high support hours, living in an
  underserved location or requiring accessible communication.
- Using disability as a proxy for cost, service value, compliance or risk to
  workers without a specific, lawful and human-reviewed safety reason.
- Making administrative savings appear as savings by shifting costs to family,
  unpaid carers, participants, or unrelated public services.
- Presenting a governmental funding shortfall as evidence that a person needs
  fewer supports.

## Principle of least authority

The engine can **suggest**, **compare**, **surface uncertainty** and **create
advisory evidence**. It cannot book, pay, claim, approve, refuse, report, terminate,
or transmit sensitive data by itself.
