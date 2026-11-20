# Disability-led governance proposal

**Status**: proposed governance design, not a statement that a council has been
established or that independent assurance has occurred.

## Change authority

1. **Maintainer review**: validates code and test evidence, software supply
   chain, data minimisation, deterministic logic and compatibility.
2. **Disability lived-experience review**: reviews whether real service journeys,
   communication modes and participant rights are represented. Fund and support
   co-design; invite disabled people with diverse life experiences and AAC needs.
3. **Domain review**: independent access, workforce, privacy, NDIS and/or
   transport specialists scrutinise the relevant use case.
4. **Independent rights review**: required for changes to hard constraints,
   matching objectives, high-impact predictions and any production capability.
5. **Named release owner**: accepts residual operational risk and documents
   release/rollback authority. No model can sign its own release.

## Change classes

- `routine`: documentation, no API/rights behaviour change.
- `algorithmic`: ranking formula, data fields, graph semantics, routing heuristics.
- `rights-critical`: consent, verification, protection of blocked providers,
  handling of disability-related data, funding exposure, crisis/continuity.

Rights-critical changes require independent governance review and an impact
assessment, including adverse-case simulations. No fixed percentage of algorithmic
weighting substitutes for non-negotiable rights.

## Transparency and contestability

- Publish non-sensitive algorithm versions, assumptions, model cards, caveats
  and anonymised/synthetic regression scenarios.
- Provide human-readable reasons and an accessible way to ask for another
  option, correct a wrong fact or refuse the suggested arrangement.
- Never disclose private person-level data in public model registers or
  community gap maps.
- Permit independent code security review and documented disagreement.

## Political independence

Policy actors and sources may be cited as provenance but their party labels are
not inputs to economic or participant-matching calculations. Test neutral
counterfactual relabelling. Transparently version law, budget and provider-
capacity assumptions. Also independently evaluate data selection, framing and
unintended adverse distributional effects.

Political neutrality is not political silence: factual policy impacts, unmet
needs, human rights harms and implementation failures should remain visible.
The code must not generate partisan endorsements, rankings or voting advice.

## Economic safeguards

A service gap or funding shortfall is an **unmet need or capacity constraint**, not
proof that the person's support requirement is excessive. Assess avoidable
administrative cost separately from any loss of direct support, unpaid family
labour, clinical harms or restricted participation.
