# Operational status

Status is append-only. Each event records state, source type, confidence, freshness, reason, and verification state. Projection chooses the latest fresh event and labels stale data as stale.

Accreditation, feature evidence, and historic reliability are not live status. A missing event is unknown, not accessible.
