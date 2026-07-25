# Access Map legacy imports

Copy operations files here for admin import / local sync:

| Operations path | Repo filename |
| --- | --- |
| `G:\Operations\MapAble\MapAble by Australian Disability Ltd.kml` | `MapAble by Australian Disability Ltd.kml` |
| Same map (short name) | `MapAble.kml` |
| Merged GeoJSON export | `accessible_locations_merged.geojson` |

Large `*.kml` / `*.geojson` payloads are gitignored. This folder may contain small **NetworkLink stubs** that point at the allowlisted Google My Maps KML:

`https://www.google.com/maps/d/kml?forcekml=1&mid=1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI`

## Refresh Access Map pins

```bash
# From a full local KML export:
python3 scripts/sync-mapable-adl-kml.py "G:/Operations/MapAble/MapAble by Australian Disability Ltd.kml"

# Or from the allowlisted My Maps URL / NetworkLink stub:
python3 scripts/sync-mapable-adl-kml.py
```

This writes `public/data/mapable-adl-places.json` used by `/accessibility-map`.

Admin UI: **Admin → Access → Import** (upload or fetch allowlisted NetworkLink).
