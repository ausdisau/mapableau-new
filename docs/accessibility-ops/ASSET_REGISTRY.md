# Accessibility Asset Registry

Service: `lib/accessibility-ops/assets/asset-registry-service.ts`

## Classes

`digital` | `built` | `service` | `integration` | `procurement`

## Criticality

Derived from purpose tags + asset type (`lib/accessibility-ops/criticality.ts`). Models must not invent criticality. Levels: informational, important, essential, safety_critical.

## Canonical references

Examples: `access_place:{id}`, `route:/ask`, `component:MapAbleButton`, `document:offline-visit-pack`, `careos_mission:{id}`, `widget:access-summary`.

## Ownership

Essential and safety-critical assets should have a human owner (`AccessibilityAssetOwner`). Unowned critical assets are an ops SLO signal.
