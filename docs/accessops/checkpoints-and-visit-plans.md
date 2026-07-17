# Checkpoints and visit plans

Opaque short-lived checkpoint tokens; visit plans with expiry, revocation and minimum necessary data; versioned offline packs with checksums and stale warnings.

## Rules

- No participant identity embedded in checkpoint tokens.
- No public indexing of visit plans.
- Offline packs encrypt participant-specific data; no unrestricted permanent cache.
