# Scale-out roadmap and potential interoperable open-source components

v0.1.0 is intentionally a small, deterministic kernel. It does not implement
'big data' infrastructure; the following are possible independently reviewed
extensions. Do not add components without validating license, current security
status, data governance and actual performance requirements.

1. **Spatial indexing**: PostgreSQL/PostGIS for nearest service catchments,
   accessibility observations and travel-time corridors. Region boundaries
   must not substitute for lived access barriers or transport availability.
2. **Service relationship store**: an indexed relational graph inside Postgres
   first; consider a separate graph engine only when validated queries require it.
3. **Network routing**: use responsibly licensed OpenStreetMap-derived networks,
   accessibility-specific path attributes and independently verified data.
   Integrate route engines only after real-world safety testing.
4. **Operations research**: trial constraint solvers for multi-vehicle and
   multi-worker scheduling, separating hard human rights/workforce constraints
   from cost objectives. Compare improvements with a simple explainable baseline.
5. **Aggregate analytics**: use a governed warehouse/lakehouse for
   de-identified service-capacity events, tracking consent and dataset lineage.
6. **Privacy-enhancing technologies**: evaluate differential privacy, secure
   aggregation, cohort suppression and risk assessments before external reports.
7. **Simulation**: develop local, synthetic digital twins for transport, worker
   availability, demand shifts and fiscal shocks, with calibrated uncertainty.
8. **Accessible experience**: map, list and table alternatives; keyboard and
   screen-reader navigation; AAC-compatible search, explained uncertainty and
   participant-controlled overrides; target WCAG 2.2 AA.

## Interoperability boundary

Adapters should translate external records into versioned domain types without
allowing data sources to self-authorise `verified` statuses. Preserve evidence
provenance and licence conditions. Data minimisation applies before model input.

## Business and research evidence

Measure actual missed visits, scheduling effort, travel costs, participant-
reported control, service continuity, accessible outcomes, worker conditions and
administrative burden. Include negative outcomes and cost-shifting, not only
optimistic scenario savings.
