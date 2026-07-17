# Feature observations

`AccessFeatureObservation` rows are append-only. Current feature values are projections.

## Rules

- Provenance, units, evidence level and observation method are required.
- Unknown is distinct from false.
- Stale observations cannot be shown as current.
- Inferred observations are labelled.
- Participant reviews are not silently converted into measurements.
- Corrections create new observations — no destructive overwrite.
- Private evidence remains private unless publication is authorised.
