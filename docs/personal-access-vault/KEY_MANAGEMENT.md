# Key Management

**Production target:** partner KMS/HSM (AU residency preferred) → environment KEKs → per-participant DEKs → optional device wraps.

**This implementation:** stores `VaultKeyReference` metadata only when encrypted store flag is on. No production master keys are created in-repo. Secret fallbacks to `NEXTAUTH_SECRET` are forbidden.

Outages: reference-only UX continues; custodial decrypt fails closed.
