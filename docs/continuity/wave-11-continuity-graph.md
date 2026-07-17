# Wave 11 — Continuity graph

The continuity graph is a directed graph of `ContinuityNodeReference` nodes and typed `ContinuityDependency` edges. Nodes are references to existing operational rows; the graph does NOT duplicate that data.

Edge kinds: `required_for`, `supports`, `transports_to`, `employed_at`, `housed_at`, `funds`, `authorises`, `other`.

Cycle detection is enforced at insert time (`upsertContinuityDependency`).

Cancelling one node NEVER auto-propagates through the graph. The graph is READ-ONLY when computing downstream impact (`computeDownstreamImpactNodes`). Actions are proposed by the recovery option builder and require a human approval to execute.
