# Guardian — Release Evidence Checklist

**Status:** `DOCUMENTED_INTENT`  
Guardian remains **NOT PRODUCTION READY** until all required rows are complete.

| Gate | Status |
|------|--------|
| Privacy owner sign-off | NOT_RUN |
| Safeguarding owner sign-off | NOT_RUN |
| Security threat model reviewed | NOT_RUN |
| External processors approved | NOT_RUN |
| Model evaluations approved | NOT_RUN |
| Bias results accepted | NOT_RUN |
| Participant challenge flow tested | NOT_RUN |
| Incident/complaint integration tested | NOT_RUN (routing decisions only in Phase 2) |
| Feature flags remain off until release approval | PASS (defaults false) |
| WCAG automated checks | NOT_RUN |
| Manual AT checks | NOT_RUN |
| Rollback tested | NOT_RUN |
| Audit evidence reviewed | NOT_RUN |

Rollback: set all `MAPABLE_GUARDIAN_*=false` (or unset). Manual complaint/incident paths unaffected.
