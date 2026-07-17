# AccessibilityOps architecture

## Target: hybrid control plane + signed runners

Canonical records and policy live in the MapAble Next.js / Prisma control plane (`lib/accessibility-ops/`). Heavy browser, document, mobile, BIM and feed tests run in isolated runners that submit **signed, hashed** results to `/api/internal/accessibility-ops/test-results`.

```
Change sources → Asset Registry → Rule Registry → Signed runners
       ↓                                    ↓
 Impact Graph (later)              Shadow evaluation (non-blocking)
       ↓                                    ↓
 Canonical incidents ← Findings/Remediation (later) → Evidence packs (later)
       ↓
 AuditEvent (correlationId / causationId)
```

## Trust boundaries

1. Public internet  
2. Authenticated organisation tenants  
3. Internal runners (HMAC secret + version pin + nonce)  
4. Untrusted feeds/PDFs (sandboxed parsers)

## Composition

- Places → AccessPlace  
- Personal fit / counterfactual / regression → Access Intelligence when registered via bridge  
- Missions / Stop / proposals → AURA / CareOSMission when registered via bridge  
- Incidents → IncidentReport + IndoorAccessibilityIncident  
- Audit → AuditEvent  

AccessibilityOps does **not** create a second Access Intelligence or AURA execution path.

## Operating modes

`demo` → `shadow` → `supervised` → `production` via `MAPABLE_ACCESSIBILITY_OPS_MODE`. Wave 1 remains **shadow** (no release blocking).
