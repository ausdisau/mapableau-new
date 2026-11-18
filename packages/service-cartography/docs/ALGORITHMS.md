# Algorithm design notes

## Guarantees and limitations by module

### Matching
- Hard exclusions: current scoped consent, blocked providers, current verified
  evidence through the proposed service period, communication/access capabilities,
  confirmed availability and valid numeric operational data.
- Among admissible options only, default score:

  `0.45 * preferred + 0.30 * reliability + 0.15 * travelFit + 0.10 * estimatedCostFit`

  where `travelFit = 1/(1+minutes/30)`, `estimatedCostFit = 1/(1+AUD_cents/10000)`,
  and `preferred = 1` if explicitly preferred, `0` if preference list exists but
  unlisted, else `0.5` for neutrality. These constants are *arbitrary prototype
  examples*, not empirically established values. Scores are never human-worth
  scores or legal eligibility judgements.
- Runtime roughly O(number_of_offers log number_of_offers).

### Evidence
- Requires explicitly verified observations that have occurred already and
  contain an expiry that remains in the future.
- `reported`, `disputed`, `stale`, `unknown` cannot satisfy a verified gate.
- Verification source and competence must be checked outside this package.

### Service dependency graph
- Traverses `requires` links with a DFS; checks missing nodes, stale nodes,
  cycles and active flags.
- Returns a topological-style dependency order when acyclic; still returns a
  diagnostic order for cycles but marks status `needs_review`.
- No relational permissions or spatial verification is inferred.

### Accessible routing
- Directed Dijkstra-style shortest-path calculation using travel-minute costs.
- Rejects closed, unverified or unmeasured segments when the participant has
  declared a relevant access constraint.
- `no_verified_route` means insufficient verified path evidence, not proof a
  location is inaccessible. Weather, lifts, closures and construction require
  real-time data and human checks outside the library.
- Dijkstra is implemented for small maps without a heap. Large-scale routing
  requires a benchmarked graph engine and current map data.

### Service gaps and equity
- Accepts **aggregate counts only**. Suppresses small published cells and avoids
  pretending missing capacity is zero.
- There is no differential privacy, secure aggregation or composition accounting.
  Default thresholds are placeholders and cannot guarantee anonymity.
- Equity output is a descriptive distribution gap; causality and discrimination
  require separate evidence, participatory review and legal analysis.

### Scheduling
- Chooses the most constrained requests first, then considers declared provider
  preferences, then stable IDs. Prevents overlapping use of an identical slot
  or shared opaque resource token. This is a *greedy heuristic* with no proof of
  global optimality or fairness across participants. Requests must receive
  participant approval and human review before any execution.
- Does not model labour conditions, travel buffers, fatigue, awards, vehicle
  regulations or emergency response. They are deployment blockers.

### Economic scenario analysis
- Required units are retained **per category**. Care hours cannot sensibly be
  added to transport trips.
- Calculates estimated cost, funding exposure and documented capacity shortfall,
  but does not decide which needs should be funded, cut or prioritised.
- A funding ceiling is a hypothetical input, NOT NDIS fund eligibility.
- Funding and capacity deficits may overlap and must never be summed as
  independent effects.

### Political-label independence
- Counterfactual test compares output after changing only a scenario's label
  and political attribution. These metadata fields are excluded from the maths.
- Does NOT prove political neutrality of training data, chosen assumptions,
  provider inventories, participant representation or policy framing.
- Perform broader independent bias and sensitivity audits before publication.

### Continuity alerting
- Detects explicitly cancelled services without confirmed fallback and services
  marked operationally critical with unknown status. No diagnosis or psychiatric
  profile inference; alerts go to authorised humans.

### Audit payload
- Builds canonical reason/source metadata only. A real append-only audit,
  signature, reconciliation, retention and access policy are host responsibilities.
