# Providers

| Provider ID | Adapter | Default | Notes |
|-------------|---------|---------|-------|
| `panoramax` | `lib/integrations/access/panoramax` | OFF | STAC imagery evidence |
| `project_sidewalk` | `lib/integrations/access/project-sidewalk` | OFF | Community labels, unverified |
| `mapable_quests` | `lib/integrations/access/mapable-quests` | OFF | Native quest observations |
| `open311` | `lib/integrations/access/open311` | OFF | Draft-first civic bridge |
| `odk` | `lib/integrations/access/odk` | OFF | Schema boundary only |
| `sensorthings` | `lib/integrations/access/sensorthings` | OFF | Temporal sensor readings |
| `sandbox` | routing sandbox provider | OFF | Navigate fixture graph |

Routing engines (`openstreetmap`, `opentripplanner`, `openrouteservice`, `valhalla`) are listed in contracts for future adapters; sandbox wraps existing navigate planner today.

## Registration

`lib/integrations/access/index.ts` bootstraps all providers on import.

## Health

Provider health aggregated via open-infrastructure health endpoint when parent flag enabled.
