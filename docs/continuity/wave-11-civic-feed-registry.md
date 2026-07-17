# Wave 11 — Civic feed registry

External civic feeds (hospital, weather, disaster, transport authority) are DISABLED by default. `CivicFeedRegistration.status` starts as `disabled` (or `proposed`), and `productionActivated` is `false`.

Activation requires two steps:

1. `approveCivicFeed(slug, approvedById)` — a human approver marks the feed `approved`.
2. `activateCivicFeed(slug)` — flips `productionActivated=true`.

Even after activation, individual signals from a feed are only usable when:

- They pass freshness (`staleAfter > now`).
- They reach `validated` status.
- Their confidence is at least `medium`.

The registry is the ONLY path by which external feeds influence continuity actions. Any code path that ingests an external feed without registering it is a bug.
