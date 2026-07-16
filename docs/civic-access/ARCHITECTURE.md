# Civic Access Architecture

## Initial (Waves 0–3)

**Option A — Modular monolith** inside MapAble:

- `lib/civic-access/`
- `app/api/civic/`
- `app/admin/civic/`
- Prisma tables additive on the shared database

## Target (Waves 4–9)

**Option D — Hybrid control plane**

MapAble owns: canonical cross-system references, journey projection, policy, provenance, public observatory, simulation control.  
Partners retain: operational AMS / GTFS / BIM / sensor systems and publish versioned feeds.

## Federation path

Partner adapters → signed `CivicSourceVersion` → optional partner-hosted twin endpoints (Option C subset).

## Fallback

Freeze federation; remain on Option A with CSV/GeoJSON imports; Observatory preview-only.

## Wave 1 data flow

```
Partner / synthetic source
  → CivicSource (+ licence + version)
  → CivicAsset (references AccessPlace)
  → StaticAccessibilityProjection
  → Internal admin / authenticated GET APIs
  → AuditEvent
```

No public publication path in Wave 1.
